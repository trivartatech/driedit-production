from fastapi import APIRouter, HTTPException, Request, Response
from auth import exchange_session_id, get_current_user, db
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])

class SessionExchange(BaseModel):
    session_id: str

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
