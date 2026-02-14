from fastapi import FastAPI
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
from pathlib import Path

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
    upload_routes
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create the main app
app = FastAPI(
    title="DRIEDIT API",
    description="Gen-Z Streetwear E-commerce Platform",
    version="1.0.0"
)

# Add rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
