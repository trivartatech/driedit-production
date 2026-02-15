from fastapi import APIRouter, HTTPException, Request, Response
from auth import get_current_user, db
from models import UserRegister, UserLogin
from slowapi import Limiter
from slowapi.util import get_remote_address
from services.email_service import send_email, get_base_template, BRAND_COLOR
import logging
import bcrypt
import uuid
import os
import random
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Environment configuration for cookies
IS_PRODUCTION = os.environ.get('ENVIRONMENT', 'development') == 'production'
# SameSite=none requires Secure=true, even in development
COOKIE_SECURE = True  # Always secure because SameSite=none requires it
COOKIE_SAMESITE = "strict" if IS_PRODUCTION else "none"

# OTP Configuration
OTP_EXPIRY_MINUTES = 10
OTP_LENGTH = 6

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

def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return ''.join([str(random.randint(0, 9)) for _ in range(OTP_LENGTH)])

async def send_otp_email(email: str, otp: str, name: str) -> bool:
    """Send OTP verification email"""
    content = f"""
    <h2 style="margin: 0 0 20px 0; color: {BRAND_COLOR}; font-size: 24px; font-weight: 900;">
        VERIFY YOUR EMAIL
    </h2>
    
    <p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
        Hey {name}! 👋<br><br>
        Welcome to DRIEDIT. Use the code below to verify your email address.
    </p>
    
    <table width="100%" style="background-color: #1a1a1a; padding: 30px; margin: 25px 0; text-align: center;">
        <tr>
            <td>
                <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: {BRAND_COLOR};">
                    {otp}
                </span>
            </td>
        </tr>
    </table>
    
    <p style="color: #888888; font-size: 13px; text-align: center;">
        This code expires in <strong style="color: #ffffff;">{OTP_EXPIRY_MINUTES} minutes</strong>.<br>
        If you didn't request this, please ignore this email.
    </p>
    """
    
    html = get_base_template(content)
    subject = f"Your Verification Code: {otp} | DRIEDIT"
    
    result = await send_email(email, subject, html)
    return result is not None


@router.post("/register/initiate")
@limiter.limit("3/minute")  # Rate limit OTP requests
async def initiate_registration(data: UserRegister, request: Request):
    """
    Step 1: Initiate registration by sending OTP to email.
    Stores pending registration data with OTP for verification.
    """
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Generate OTP
        otp = generate_otp()
        otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
        
        # Hash password for secure storage
        hashed_password = hash_password(data.password)
        
        # Store or update pending registration
        pending_data = {
            "email": data.email,
            "name": data.name,
            "password": hashed_password,
            "otp": otp,
            "otp_expiry": otp_expiry,
            "attempts": 0,
            "created_at": datetime.now(timezone.utc)
        }
        
        # Upsert pending registration (replace if exists)
        await db.pending_registrations.update_one(
            {"email": data.email},
            {"$set": pending_data},
            upsert=True
        )
        
        # Send OTP email
        email_sent = await send_otp_email(data.email, otp, data.name)
        
        if not email_sent:
            logger.warning(f"Failed to send OTP email to {data.email}")
            # Still return success to prevent enumeration, but log the issue
        
        return {
            "message": "Verification code sent to your email",
            "email": data.email,
            "expires_in_minutes": OTP_EXPIRY_MINUTES
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initiating registration: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate registration")


@router.post("/register/verify")
@limiter.limit("5/minute")  # Rate limit verification attempts
async def verify_registration(request: Request, response: Response):
    """
    Step 2: Verify OTP and complete registration.
    Creates user account after successful OTP verification.
    """
    try:
        body = await request.json()
        email = body.get("email")
        otp = body.get("otp")
        
        if not email or not otp:
            raise HTTPException(status_code=400, detail="Email and OTP are required")
        
        # Find pending registration
        pending = await db.pending_registrations.find_one({"email": email})
        
        if not pending:
            raise HTTPException(status_code=400, detail="No pending registration found. Please register again.")
        
        # Check if max attempts exceeded
        if pending.get("attempts", 0) >= 5:
            await db.pending_registrations.delete_one({"email": email})
            raise HTTPException(status_code=400, detail="Too many failed attempts. Please register again.")
        
        # Check OTP expiry
        if pending.get("otp_expiry") < datetime.now(timezone.utc):
            await db.pending_registrations.delete_one({"email": email})
            raise HTTPException(status_code=400, detail="Verification code expired. Please register again.")
        
        # Verify OTP
        if pending.get("otp") != otp:
            # Increment attempts
            await db.pending_registrations.update_one(
                {"email": email},
                {"$inc": {"attempts": 1}}
            )
            remaining = 5 - pending.get("attempts", 0) - 1
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid verification code. {remaining} attempts remaining."
            )
        
        # OTP verified - create user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        user_data = {
            "user_id": user_id,
            "email": pending["email"],
            "name": pending["name"],
            "password": pending["password"],
            "auth_provider": "email",
            "role": "user",
            "is_verified": True,
            "email_verified_at": datetime.now(timezone.utc),
            "wishlist": [],
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.users.insert_one(user_data)
        
        # Delete pending registration
        await db.pending_registrations.delete_one({"email": email})
        
        # Create session
        session_token = create_session_token(user_id)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            path="/",
            max_age=7 * 24 * 60 * 60
        )
        
        # Remove password from response
        user_data.pop('password')
        
        return {"user": user_data, "message": "Email verified successfully! Welcome to DRIEDIT."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying registration: {e}")
        raise HTTPException(status_code=500, detail="Verification failed")


@router.post("/register/resend-otp")
@limiter.limit("2/minute")  # Strict rate limit on resends
async def resend_otp(request: Request):
    """
    Resend OTP for pending registration.
    """
    try:
        body = await request.json()
        email = body.get("email")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Find pending registration
        pending = await db.pending_registrations.find_one({"email": email})
        
        if not pending:
            raise HTTPException(status_code=400, detail="No pending registration found. Please register again.")
        
        # Generate new OTP
        otp = generate_otp()
        otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
        
        # Update OTP
        await db.pending_registrations.update_one(
            {"email": email},
            {"$set": {"otp": otp, "otp_expiry": otp_expiry, "attempts": 0}}
        )
        
        # Send OTP email
        email_sent = await send_otp_email(email, otp, pending.get("name", ""))
        
        if not email_sent:
            logger.warning(f"Failed to resend OTP email to {email}")
        
        return {
            "message": "New verification code sent to your email",
            "expires_in_minutes": OTP_EXPIRY_MINUTES
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resending OTP: {e}")
        raise HTTPException(status_code=500, detail="Failed to resend verification code")


# Keep the old register endpoint for backward compatibility but redirect to new flow
@router.post("/register")
async def register(data: UserRegister, response: Response):
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
        user.pop('password')
        
        return {"user": user, "message": "Login successful"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in login: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

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
        
        # Clear cookie with environment-aware settings
        response.delete_cookie(
            key="session_token",
            path="/",
            samesite=COOKIE_SAMESITE,
            secure=COOKIE_SECURE
        )
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Error in logout: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
