"""
Password Reset Routes
Forgot password and reset password functionality with secure token generation.
"""
from fastapi import APIRouter, HTTPException, Request
from auth import db
from pydantic import BaseModel, EmailStr
import bcrypt
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
import logging
import asyncio

# Email service
from services.email_service import send_email, get_base_template, BRAND_COLOR

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Token expiry time
TOKEN_EXPIRY_HOURS = 1


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def generate_reset_token() -> tuple[str, str]:
    """
    Generate a secure reset token.
    Returns (raw_token, hashed_token).
    Raw token is sent to user, hashed token is stored in DB.
    """
    raw_token = secrets.token_urlsafe(32)
    hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()
    return raw_token, hashed_token


def hash_token(token: str) -> str:
    """Hash a token for comparison."""
    return hashlib.sha256(token.encode()).hexdigest()


async def send_password_reset_email(email: str, reset_token: str, user_name: str = "User") -> bool:
    """Send password reset email with the reset link."""
    
    # Construct reset URL (frontend will handle this)
    reset_url = f"/reset-password?token={reset_token}"
    
    content = f"""
    <h2 style="margin: 0 0 20px 0; color: {BRAND_COLOR}; font-size: 24px; font-weight: 900;">
        PASSWORD RESET REQUEST
    </h2>
    
    <p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
        Hi {user_name},<br><br>
        We received a request to reset your password. Click the button below to create a new password.
    </p>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
        <tr>
            <td align="center">
                <a href="{reset_url}" style="display: inline-block; background-color: {BRAND_COLOR}; color: #ffffff; 
                   padding: 15px 40px; text-decoration: none; font-weight: bold; font-size: 14px;">
                    RESET PASSWORD
                </a>
            </td>
        </tr>
    </table>
    
    <table width="100%" style="background-color: #1a1a1a; padding: 15px; margin: 20px 0;">
        <tr>
            <td style="color: #888888; font-size: 12px;">
                <strong style="color: #ffffff;">⚠️ Important:</strong><br>
                • This link expires in {TOKEN_EXPIRY_HOURS} hour<br>
                • If you didn't request this, ignore this email<br>
                • Never share this link with anyone
            </td>
        </tr>
    </table>
    
    <p style="color: #666666; font-size: 12px; margin-top: 30px;">
        If the button doesn't work, copy and paste this link:<br>
        <span style="color: #888888; word-break: break-all;">{reset_url}</span>
    </p>
    """
    
    html = get_base_template(content)
    result = await send_email(email, "Reset Your Password | DRIEDIT", html)
    return result is not None


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """
    Request password reset. Sends email with reset link if user exists.
    Always returns success to prevent email enumeration.
    """
    email = data.email.lower().strip()
    
    # Find user
    user = await db.users.find_one({"email": email})
    
    if user:
        # Check if user uses email auth (not Google OAuth)
        if user.get("auth_provider") == "google":
            logger.warning(f"Password reset attempted for Google OAuth user: {email}")
            # Still return success to prevent enumeration
        else:
            # Invalidate any existing reset tokens for this user
            await db.password_resets.delete_many({"user_id": user["user_id"]})
            
            # Generate new token
            raw_token, hashed_token = generate_reset_token()
            
            # Store token in database
            reset_record = {
                "user_id": user["user_id"],
                "email": email,
                "token_hash": hashed_token,
                "created_at": datetime.now(timezone.utc),
                "expires_at": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS),
                "used": False
            }
            await db.password_resets.insert_one(reset_record)
            
            # Send email (non-blocking)
            user_name = user.get("name", "User")
            asyncio.create_task(send_password_reset_email(email, raw_token, user_name))
            
            logger.info(f"Password reset requested for: {email}")
    else:
        logger.info(f"Password reset requested for non-existent email: {email}")
    
    # Always return success to prevent email enumeration
    return {
        "message": "If an account exists with this email, you will receive a password reset link shortly."
    }


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """
    Reset password using the token from email.
    """
    # Hash the provided token
    token_hash = hash_token(data.token)
    
    # Find the reset record
    reset_record = await db.password_resets.find_one({
        "token_hash": token_hash,
        "used": False
    })
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    
    # Check if token is expired
    expires_at = reset_record["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if datetime.now(timezone.utc) > expires_at:
        # Mark as used to prevent reuse attempts
        await db.password_resets.update_one(
            {"_id": reset_record["_id"]},
            {"$set": {"used": True}}
        )
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")
    
    # Validate new password
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Hash new password
    hashed_password = bcrypt.hashpw(data.new_password.encode(), bcrypt.gensalt()).decode()
    
    # Update user password
    result = await db.users.update_one(
        {"user_id": reset_record["user_id"]},
        {"$set": {
            "password": hashed_password,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update password")
    
    # Mark token as used
    await db.password_resets.update_one(
        {"_id": reset_record["_id"]},
        {"$set": {"used": True}}
    )
    
    logger.info(f"Password reset successful for user: {reset_record['user_id']}")
    
    return {"message": "Password reset successful. You can now login with your new password."}


@router.get("/verify-reset-token/{token}")
async def verify_reset_token(token: str):
    """
    Verify if a reset token is valid (for frontend validation).
    """
    token_hash = hash_token(token)
    
    reset_record = await db.password_resets.find_one({
        "token_hash": token_hash,
        "used": False
    })
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid reset link")
    
    # Check expiry
    expires_at = reset_record["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset link has expired")
    
    return {"valid": True, "email": reset_record["email"]}
