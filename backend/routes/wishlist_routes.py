from fastapi import APIRouter, HTTPException, Request
from auth import get_current_user, db
from typing import List

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])

@router.get("", response_model=List[str])
async def get_wishlist(request: Request):
    """
    Get user's wishlist (product IDs).
    """
    user = await get_current_user(request)
    return user.get("wishlist", [])

@router.post("/add/{product_id}")
async def add_to_wishlist(product_id: str, request: Request):
    """
    Add product to wishlist.
    """
    user = await get_current_user(request)
    
    # Check if product exists
    product = await db.products.find_one({"product_id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Add to wishlist (avoid duplicates)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$addToSet": {"wishlist": product_id}}
    )
    
    return {"message": "Added to wishlist"}

@router.delete("/remove/{product_id}")
async def remove_from_wishlist(product_id: str, request: Request):
    """
    Remove product from wishlist.
    """
    user = await get_current_user(request)
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$pull": {"wishlist": product_id}}
    )
    
    return {"message": "Removed from wishlist"}

@router.get("/products")
async def get_wishlist_products(request: Request):
    """
    Get full product details for wishlist items.
    """
    user = await get_current_user(request)
    wishlist_ids = user.get("wishlist", [])
    
    if not wishlist_ids:
        return []
    
    products = await db.products.find(
        {"product_id": {"$in": wishlist_ids}},
        {"_id": 0}
    ).to_list(100)
    
    return products
