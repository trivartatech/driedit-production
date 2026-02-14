from fastapi import APIRouter, HTTPException, Request
from auth import get_current_user, require_admin, db
from models import Category, CategoryCreate
from typing import List
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/categories", tags=["categories"])

@router.get("", response_model=List[Category])
async def get_categories():
    """
    Get all categories. Public endpoint.
    """
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@router.post("", response_model=Category)
async def create_category(category_data: CategoryCreate, request: Request):
    """
    Create new category (Admin only).
    """
    await require_admin(request)
    
    # Check if slug already exists
    existing = await db.categories.find_one({"slug": category_data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Category slug already exists")
    
    category_id = f"cat_{uuid.uuid4().hex[:12]}"
    
    category = {
        "category_id": category_id,
        "name": category_data.name,
        "slug": category_data.slug,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.categories.insert_one(category)
    
    return category

@router.put("/{category_id}", response_model=Category)
async def update_category(category_id: str, category_data: CategoryCreate, request: Request):
    """
    Update category (Admin only).
    """
    await require_admin(request)
    
    # Check if exists
    existing = await db.categories.find_one({"category_id": category_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await db.categories.update_one(
        {"category_id": category_id},
        {"$set": {
            "name": category_data.name,
            "slug": category_data.slug
        }}
    )
    
    # Update all products with this category
    await db.products.update_many(
        {"category_id": category_id},
        {"$set": {"category_name": category_data.name}}
    )
    
    updated_category = await db.categories.find_one(
        {"category_id": category_id},
        {"_id": 0}
    )
    
    return updated_category

@router.delete("/{category_id}")
async def delete_category(category_id: str, request: Request):
    """
    Delete category (Admin only).
    Cannot delete if products exist in this category.
    """
    await require_admin(request)
    
    # Check if any products use this category
    product_count = await db.products.count_documents({"category_id": category_id})
    if product_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category with {product_count} products"
        )
    
    result = await db.categories.delete_one({"category_id": category_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted successfully"}
