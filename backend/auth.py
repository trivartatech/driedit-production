from fastapi import HTTPException, Request, Depends
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import requests
from datetime import datetime, timezone, timedelta
import uuid
from typing import Optional
import logging

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Get database
def get_db():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    return client[os.environ['DB_NAME']]

db = get_db()

# Auth helper to get current user from session_token
async def get_current_user(request: Request) -> dict:
    """
    Get current user from session_token in cookies or Authorization header.
    Returns user dict or raises 401 HTTPException.
    """
    # Try to get session_token from cookies first
    session_token = request.cookies.get('session_token')
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            session_token = auth_header.replace('Bearer ', '')
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session in database
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry with timezone awareness
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        # Delete expired session
        await db.user_sessions.delete_one({"session_token": session_token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user data
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user_doc

# Admin-only decorator
async def require_admin(request: Request) -> dict:
    """
    Require admin role. Returns user dict or raises 403.
    """
    user = await get_current_user(request)
    
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user

# Exchange session_id for user data
async def exchange_session_id(session_id: str) -> dict:
    """
    Exchange session_id from Emergent Auth for user data.
    Creates/updates user in database and returns session_token.
    """
    try:
        # Call Emergent Auth API
        response = requests.get(
            'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
            headers={'X-Session-ID': session_id},
            timeout=10
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid session_id")
        
        auth_data = response.json()
        
        # Check if user exists
        existing_user = await db.users.find_one(
            {"email": auth_data['email']},
            {"_id": 0}
        )
        
        if existing_user:
            user_id = existing_user['user_id']
            # Update user data
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {
                    "name": auth_data.get('name', ''),
                    "picture": auth_data.get('picture', ''),
                    "auth_provider": "google"
                }}
            )
        else:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": auth_data['email'],
                "name": auth_data.get('name', ''),
                "picture": auth_data.get('picture', ''),
                "password": None,
                "auth_provider": "google",
                "role": "user",
                "is_verified": True,
                "wishlist": [],
                "created_at": datetime.now(timezone.utc)
            })
        
        # Create session
        session_token = auth_data['session_token']
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        # Delete old sessions for this user
        await db.user_sessions.delete_many({"user_id": user_id})
        
        # Insert new session
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Get user data to return
        user_doc = await db.users.find_one(
            {"user_id": user_id},
            {"_id": 0}
        )
        
        return {
            "user": user_doc,
            "session_token": session_token
        }
        
    except requests.RequestException as e:
        logger.error(f"Error calling Emergent Auth API: {e}")
        raise HTTPException(status_code=500, detail="Auth service error")
    except Exception as e:
        logger.error(f"Error in exchange_session_id: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
