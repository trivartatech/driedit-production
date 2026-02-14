from fastapi import APIRouter, HTTPException, Request
from auth import get_current_user, require_admin, db
from models import Review, ReviewCreate
from typing import List
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

@router.get("/product/{product_id}", response_model=List[Review])
async def get_product_reviews(product_id: str):
    """
    Get all reviews for a product. Public endpoint.
    """
    reviews = await db.reviews.find(
        {"product_id": product_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return reviews

@router.post("", response_model=Review)
async def create_review(review_data: ReviewCreate, request: Request):
    """
    Create a review. User must be authenticated.
    Only verified buyers (who purchased the product) can review.
    """
    user = await get_current_user(request)
    
    # Check if user has purchased this product
    order = await db.orders.find_one({
        "user_id": user["user_id"],
        "items.product_id": review_data.product_id,
        "order_status": {"$in": ["confirmed", "shipped", "delivered"]}
    })
    
    verified = order is not None
    
    # Check if user already reviewed this product
    existing_review = await db.reviews.find_one({
        "user_id": user["user_id"],
        "product_id": review_data.product_id
    })
    
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    
    review_id = f"rev_{uuid.uuid4().hex[:12]}"
    
    review = {
        "review_id": review_id,
        "product_id": review_data.product_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "rating": review_data.rating,
        "review_text": review_data.review_text,
        "verified": verified,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.reviews.insert_one(review)
    
    return review

@router.delete("/admin/{review_id}")
async def delete_review(review_id: str, request: Request):
    """
    Delete a review (Admin only).
    Used to remove inappropriate reviews.
    """
    await require_admin(request)
    
    result = await db.reviews.delete_one({"review_id": review_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return {"message": "Review deleted successfully"}
