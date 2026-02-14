from fastapi import APIRouter, HTTPException, Request
from auth import get_current_user, db
from models import Product, ProductCreate, ProductUpdate
from typing import List, Optional
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    sort: Optional[str] = "featured",
    limit: int = 100
):
    """
    Get all products with optional filtering and sorting.
    Public endpoint - no auth required.
    """
    query = {}
    
    if category and category != "all":
        query["category_name"] = category
    
    # Determine sort order
    sort_criteria = {}
    if sort == "price-low":
        sort_criteria = {"discounted_price": 1}
    elif sort == "price-high":
        sort_criteria = {"discounted_price": -1}
    elif sort == "newest":
        sort_criteria = {"created_at": -1}
    else:  # featured (by sales_count)
        sort_criteria = {"sales_count": -1}
    
    products = await db.products.find(query, {"_id": 0}).sort([(k, v) for k, v in sort_criteria.items()]).limit(limit).to_list(limit)
    
    return products

@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """
    Get single product by ID.
    Public endpoint - no auth required.
    """
    product = await db.products.find_one(
        {"product_id": product_id},
        {"_id": 0}
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product

@router.post("", response_model=Product)
async def create_product(product_data: ProductCreate, request: Request):
    """
    Create new product (Admin only).
    """
    from auth import require_admin
    await require_admin(request)
    
    # Get category name
    category = await db.categories.find_one(
        {"category_id": product_data.category_id},
        {"_id": 0}
    )
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    product_id = f"prod_{uuid.uuid4().hex[:12]}"
    
    product = {
        "product_id": product_id,
        "title": product_data.title,
        "category_id": product_data.category_id,
        "category_name": category["name"],
        "regular_price": product_data.regular_price,
        "discounted_price": product_data.discounted_price,
        "sizes": product_data.sizes,
        "stock": product_data.stock,
        "images": product_data.images,
        "description": product_data.description,
        "sales_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.products.insert_one(product)
    
    return product

@router.put("/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductUpdate, request: Request):
    """
    Update product (Admin only).
    """
    from auth import require_admin
    await require_admin(request)
    
    # Check if product exists
    existing = await db.products.find_one({"product_id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Build update dict
    update_data = product_data.dict(exclude_unset=True)
    
    # If category_id changed, update category_name
    if "category_id" in update_data:
        category = await db.categories.find_one(
            {"category_id": update_data["category_id"]},
            {"_id": 0}
        )
        if category:
            update_data["category_name"] = category["name"]
    
    if update_data:
        await db.products.update_one(
            {"product_id": product_id},
            {"$set": update_data}
        )
    
    # Return updated product
    updated_product = await db.products.find_one(
        {"product_id": product_id},
        {"_id": 0}
    )
    
    return updated_product

@router.delete("/{product_id}")
async def delete_product(product_id: str, request: Request):
    """
    Delete product (Admin only).
    """
    from auth import require_admin
    await require_admin(request)
    
    result = await db.products.delete_one({"product_id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}


@router.get("/{product_id}/recommendations", response_model=List[Product])
async def get_product_recommendations(product_id: str, limit: int = 4):
    """
    Get product recommendations based on a combination of:
    1. Same category products
    2. Best sellers (highest sales_count)
    
    Public endpoint - no auth required.
    """
    # Get the current product to know its category
    current_product = await db.products.find_one(
        {"product_id": product_id},
        {"_id": 0, "category_id": 1, "category_name": 1}
    )
    
    if not current_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    recommendations = []
    product_ids_added = {product_id}  # Track added product IDs to avoid duplicates
    
    # Strategy 1: Get same category products (sorted by sales_count)
    same_category_products = await db.products.find(
        {
            "product_id": {"$ne": product_id},
            "category_id": current_product["category_id"],
            "stock": {"$gt": 0}  # Only in-stock products
        },
        {"_id": 0}
    ).sort("sales_count", -1).limit(limit).to_list(limit)
    
    for product in same_category_products:
        if product["product_id"] not in product_ids_added:
            recommendations.append(product)
            product_ids_added.add(product["product_id"])
    
    # Strategy 2: If we need more, get best sellers from other categories
    if len(recommendations) < limit:
        remaining_slots = limit - len(recommendations)
        best_sellers = await db.products.find(
            {
                "product_id": {"$nin": list(product_ids_added)},
                "stock": {"$gt": 0}
            },
            {"_id": 0}
        ).sort("sales_count", -1).limit(remaining_slots).to_list(remaining_slots)
        
        for product in best_sellers:
            if product["product_id"] not in product_ids_added:
                recommendations.append(product)
                product_ids_added.add(product["product_id"])
                if len(recommendations) >= limit:
                    break
    
    return recommendations
