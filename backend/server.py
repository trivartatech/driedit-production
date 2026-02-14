from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from datetime import datetime, timezone

# Import all route modules
from routes import (
    auth_routes,
    product_routes,
    category_routes,
    wishlist_routes,
    order_routes,
    review_routes,
    return_routes,
    admin_routes,
    public_routes,
    cart_routes,
    upload_routes,
    coupon_routes,
    password_reset_routes,
    shipping_tier_routes
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Environment configuration
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
IS_PRODUCTION = ENVIRONMENT == 'production'

# Configure logging with rotation for production
LOG_DIR = ROOT_DIR / 'logs'
LOG_DIR.mkdir(exist_ok=True)

# Set up rotating file handler for error logs
error_handler = RotatingFileHandler(
    LOG_DIR / 'error.log',
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
error_handler.setLevel(logging.ERROR)
error_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))

# Set up rotating file handler for all logs
access_handler = RotatingFileHandler(
    LOG_DIR / 'access.log',
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
access_handler.setLevel(logging.INFO)
access_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))

logging.basicConfig(
    level=logging.INFO if not IS_PRODUCTION else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        error_handler,
        access_handler
    ]
)
logger = logging.getLogger(__name__)
logger.info(f"Starting DRIEDIT API in {ENVIRONMENT} mode")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create the main app
app = FastAPI(
    title="DRIEDIT API",
    description="Gen-Z Streetwear E-commerce Platform",
    version="1.0.0",
    docs_url="/api/docs" if not IS_PRODUCTION else None,  # Disable docs in production
    redoc_url="/api/redoc" if not IS_PRODUCTION else None
)

# Add rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# HTTPS enforcement middleware for production
@app.middleware("http")
async def enforce_https(request: Request, call_next):
    # Check X-Forwarded-Proto header (set by reverse proxy/load balancer)
    if IS_PRODUCTION:
        forwarded_proto = request.headers.get("x-forwarded-proto", "http")
        if forwarded_proto != "https":
            url = request.url.replace(scheme="https")
            return RedirectResponse(url=str(url), status_code=301)
    return await call_next(request)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    if IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# CORS configuration - restrict in production
cors_origins = os.environ.get('CORS_ORIGINS', '*')
if cors_origins == '*' and IS_PRODUCTION:
    cors_origins = ["https://driedit.in", "https://www.driedit.in"]
else:
    cors_origins = cors_origins.split(',') if cors_origins != '*' else ["*"]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth_routes.router)
app.include_router(product_routes.router)
app.include_router(category_routes.router)
app.include_router(wishlist_routes.router)
app.include_router(order_routes.router)
app.include_router(review_routes.router)
app.include_router(return_routes.router)
app.include_router(admin_routes.router)
app.include_router(public_routes.router)
app.include_router(cart_routes.router)
app.include_router(upload_routes.router)
app.include_router(coupon_routes.router)
app.include_router(password_reset_routes.router)
app.include_router(shipping_tier_routes.router)

# Health check endpoint
@app.get("/api/")
async def root():
    return {"message": "DRIEDIT API is running", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# Shutdown event
@app.on_event("shutdown")
async def shutdown_db_client():
    from auth import db
    if hasattr(db, 'client'):
        db.client.close()
