from fastapi import APIRouter, HTTPException, Request, Response
from auth import exchange_session_id, get_current_user, db
from models import UserRegister, UserLogin
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging
import bcrypt
import uuid
import os
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Environment configuration for cookies
IS_PRODUCTION = os.environ.get('ENVIRONMENT', 'development') == 'production'
COOKIE_SECURE = IS_PRODUCTION  # Only secure in production (requires HTTPS)
COOKIE_SAMESITE = "strict" if IS_PRODUCTION else "none"

class SessionExchange(BaseModel):
    session_id: str

# Helper functions for password hashing
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_session_token(user_id: str) -> str:
    """Generate session token"""
    return f"session_{uuid.uuid4().hex}_{user_id}"

@router.post("/register")
async def register(data: UserRegister, response: Response):
    """
    Register new user with email and password.
    """
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        hashed_password = hash_password(data.password)
        
        user_data = {
            "user_id": user_id,
            "email": data.email,
            "name": data.name,
            "password": hashed_password,
            "auth_provider": "email",
            "role": "user",
            "is_verified": False,  # Can add email verification later
            "wishlist": [],
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.users.insert_one(user_data)
        
        # Create session
        session_token = create_session_token(user_id)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set httpOnly cookie with environment-aware settings
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        # Remove password from response
        user_data.pop('password')
        
        return {"user": user_data, "message": "Registration successful"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in register: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login")
@limiter.limit("5/15minutes")  # Rate limit: 5 attempts per 15 minutes
async def login(data: UserLogin, request: Request, response: Response):
    """
    Login with email and password.
    Rate limited to prevent brute force attacks.
    """
    try:
        # Find user by email
        user = await db.users.find_one({"email": data.email}, {"_id": 0})
        
        # Account enumeration protection: same error for both cases
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if user has password (not Google user)
        if not user.get("password"):
            raise HTTPException(status_code=400, detail="This email is registered with Google. Please use Google login.")
        
        # Verify password - same error message for security
        if not verify_password(data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Delete old sessions
        await db.user_sessions.delete_many({"user_id": user["user_id"]})
        
        # Create new session
        session_token = create_session_token(user["user_id"])
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        await db.user_sessions.insert_one({
            "user_id": user["user_id"],
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        # Remove password from response
        user.pop('password')
        
        return {"user": user, "message": "Login successful"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in login: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/session")
async def create_session(data: SessionExchange, response: Response):
    """
    Exchange session_id from Emergent Auth for user data and session_token.
    Sets httpOnly cookie with session_token.
    """
    try:
        result = await exchange_session_id(data.session_id)
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=result["session_token"],
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        return {"user": result["user"]}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in create_session: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/me")
async def get_me(request: Request):
    """
    Get current authenticated user data.
    Verifies session_token from cookies or Authorization header.
    """
    user = await get_current_user(request)
    return user

@router.post("/logout")
async def logout(request: Request, response: Response):
    """
    Logout user by deleting session and clearing cookie.
    """
    try:
        # Get session_token
        session_token = request.cookies.get('session_token')
        
        if not session_token:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                session_token = auth_header.replace('Bearer ', '')
        
        if session_token:
            # Delete session from database
            await db.user_sessions.delete_one({"session_token": session_token})
        
        # Clear cookie
        response.delete_cookie(
            key="session_token",
            path="/",
            samesite="none"
        )
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Error in logout: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
