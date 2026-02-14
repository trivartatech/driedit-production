"""
Google OAuth 2.0 Routes for DRIEDIT
Backend-controlled OAuth flow for secure authentication.
"""
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from auth import db
import os
import uuid
import httpx
import logging
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth/google", tags=["google-auth"])

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', '')

# Google OAuth endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

# Cookie settings
IS_PRODUCTION = os.environ.get('ENVIRONMENT', 'development') == 'production'
COOKIE_SECURE = True
COOKIE_SAMESITE = "strict" if IS_PRODUCTION else "lax"

# Frontend URL for redirects
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://driedit-preview.preview.emergentagent.com')


def is_google_oauth_configured() -> bool:
    """Check if Google OAuth is properly configured."""
    return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI)


@router.get("/login")
async def google_login(request: Request):
    """
    Initiate Google OAuth flow.
    Redirects user to Google's consent screen.
    """
    if not is_google_oauth_configured():
        raise HTTPException(
            status_code=503, 
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI."
        )
    
    # Generate state parameter for CSRF protection
    state = uuid.uuid4().hex
    
    # Store state in a temporary cookie for verification
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "state": state,
        "prompt": "select_account"  # Always show account selector
    }
    
    auth_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    
    response = RedirectResponse(url=auth_url, status_code=302)
    
    # Set state cookie for CSRF verification
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",  # Must be lax for OAuth redirect
        max_age=600,  # 10 minutes
        path="/"
    )
    
    logger.info("Initiating Google OAuth flow")
    return response


@router.get("/callback")
async def google_callback(
    request: Request,
    response: Response,
    code: str = None,
    state: str = None,
    error: str = None
):
    """
    Handle Google OAuth callback.
    Exchange authorization code for tokens, verify, and create/link user.
    """
    if not is_google_oauth_configured():
        raise HTTPException(status_code=503, detail="Google OAuth is not configured")
    
    # Check for OAuth errors
    if error:
        logger.error(f"Google OAuth error: {error}")
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=oauth_denied",
            status_code=302
        )
    
    if not code:
        logger.error("No authorization code received")
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=no_code",
            status_code=302
        )
    
    # Verify state for CSRF protection
    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        logger.error("OAuth state mismatch - possible CSRF attack")
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=invalid_state",
            status_code=302
        )
    
    try:
        # Exchange authorization code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": GOOGLE_REDIRECT_URI
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if token_response.status_code != 200:
                logger.error(f"Token exchange failed: {token_response.text}")
                return RedirectResponse(
                    url=f"{FRONTEND_URL}/login?error=token_exchange_failed",
                    status_code=302
                )
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            if not access_token:
                logger.error("No access token in response")
                return RedirectResponse(
                    url=f"{FRONTEND_URL}/login?error=no_access_token",
                    status_code=302
                )
            
            # Get user info from Google
            userinfo_response = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if userinfo_response.status_code != 200:
                logger.error(f"Failed to get user info: {userinfo_response.text}")
                return RedirectResponse(
                    url=f"{FRONTEND_URL}/login?error=userinfo_failed",
                    status_code=302
                )
            
            user_info = userinfo_response.json()
        
        # Extract user data
        google_id = user_info.get("sub")
        email = user_info.get("email")
        name = user_info.get("name", "")
        picture = user_info.get("picture", "")
        email_verified = user_info.get("email_verified", False)
        
        if not email:
            logger.error("No email in Google response")
            return RedirectResponse(
                url=f"{FRONTEND_URL}/login?error=no_email",
                status_code=302
            )
        
        logger.info(f"Google OAuth successful for: {email}")
        
        # Check if user exists by email or google_id
        existing_user = await db.users.find_one({
            "$or": [
                {"email": email},
                {"google_id": google_id}
            ]
        })
        
        if existing_user:
            user_id = existing_user["user_id"]
            
            # Link Google account if not already linked
            update_data = {
                "google_id": google_id,
                "picture": picture,
                "updated_at": datetime.now(timezone.utc)
            }
            
            # Update name only if not set
            if not existing_user.get("name"):
                update_data["name"] = name
            
            # Mark as verified since Google verified the email
            if email_verified:
                update_data["is_verified"] = True
            
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": update_data}
            )
            
            logger.info(f"Linked Google account to existing user: {user_id}")
        else:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            
            new_user = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "password": None,  # No password for Google users
                "google_id": google_id,
                "auth_provider": "google",
                "role": "user",
                "is_verified": email_verified,
                "wishlist": [],
                "created_at": datetime.now(timezone.utc)
            }
            
            await db.users.insert_one(new_user)
            logger.info(f"Created new user from Google: {user_id}")
        
        # Create session
        session_token = f"session_{uuid.uuid4().hex}_{user_id}"
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        # Delete old sessions for this user
        await db.user_sessions.delete_many({"user_id": user_id})
        
        # Insert new session
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc),
            "auth_method": "google"
        })
        
        # Create redirect response with cookie
        redirect_response = RedirectResponse(
            url=f"{FRONTEND_URL}/?login=success",
            status_code=302
        )
        
        # Set session cookie
        redirect_response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        # Clear OAuth state cookie
        redirect_response.delete_cookie(
            key="oauth_state",
            path="/",
            samesite="lax"
        )
        
        logger.info(f"Google OAuth login successful for user: {user_id}")
        return redirect_response
        
    except httpx.RequestError as e:
        logger.error(f"HTTP request error during OAuth: {e}")
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=network_error",
            status_code=302
        )
    except Exception as e:
        logger.error(f"Unexpected error during Google OAuth: {e}")
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=server_error",
            status_code=302
        )


@router.get("/status")
async def google_oauth_status():
    """
    Check if Google OAuth is configured (public endpoint).
    Does not expose secrets.
    """
    return {
        "configured": is_google_oauth_configured(),
        "client_id_set": bool(GOOGLE_CLIENT_ID),
        "redirect_uri_set": bool(GOOGLE_REDIRECT_URI)
    }
