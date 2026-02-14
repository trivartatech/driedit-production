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
