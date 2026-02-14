from fastapi import APIRouter, HTTPException, Request
from auth import require_admin, db
from models import SizeCreate, SizeUpdate
import logging
import uuid
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/sizes", tags=["admin-sizes"])

# Default sizes to seed
DEFAULT_SIZES = [
    {"name": "XS", "category_type": "clothing"},
    {"name": "S", "category_type": "clothing"},
    {"name": "M", "category_type": "clothing"},
    {"name": "L", "category_type": "clothing"},
    {"name": "XL", "category_type": "clothing"},
    {"name": "XXL", "category_type": "clothing"},
    {"name": "28", "category_type": "bottomwear"},
    {"name": "30", "category_type": "bottomwear"},
    {"name": "32", "category_type": "bottomwear"},
    {"name": "34", "category_type": "bottomwear"},
    {"name": "36", "category_type": "bottomwear"},
    {"name": "38", "category_type": "bottomwear"},
]


@router.get("")
async def get_all_sizes(request: Request, include_inactive: bool = False):
    """Get all sizes (Admin only)"""
    await require_admin(request)
    
    query = {} if include_inactive else {"active": True}
    sizes = await db.sizes.find(query, {"_id": 0}).sort("name", 1).to_list(100)
    
    return {"sizes": sizes, "count": len(sizes)}


@router.get("/active")
async def get_active_sizes():
    """Get active sizes (Public - for product forms)"""
    sizes = await db.sizes.find({"active": True}, {"_id": 0}).sort("name", 1).to_list(100)
    
    # Group by category_type
    grouped = {}
    for size in sizes:
        cat_type = size.get("category_type", "clothing")
        if cat_type not in grouped:
            grouped[cat_type] = []
        grouped[cat_type].append(size)
    
    return {"sizes": sizes, "grouped": grouped, "count": len(sizes)}


@router.post("")
async def create_size(request: Request, data: SizeCreate):
    """Create a new size (Admin only)"""
    await require_admin(request)
    
    # Check if size name already exists
    existing = await db.sizes.find_one({"name": data.name.upper().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Size with this name already exists")
    
    size_id = f"size_{uuid.uuid4().hex[:12]}"
    size_data = {
        "size_id": size_id,
        "name": data.name.upper().strip(),
        "category_type": data.category_type.lower().strip(),
        "active": data.active,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.sizes.insert_one(size_data)
    
    # Remove _id for response
    size_data.pop("_id", None)
    
    return {"message": "Size created successfully", "size": size_data}


@router.put("/{size_id}")
async def update_size(request: Request, size_id: str, data: SizeUpdate):
    """Update a size (Admin only)"""
    await require_admin(request)
    
    # Find size
    size = await db.sizes.find_one({"size_id": size_id})
    if not size:
        raise HTTPException(status_code=404, detail="Size not found")
    
    update_data = {}
    
    if data.name is not None:
        # Check if new name already exists (excluding current)
        new_name = data.name.upper().strip()
        existing = await db.sizes.find_one({"name": new_name, "size_id": {"$ne": size_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Size with this name already exists")
        update_data["name"] = new_name
    
    if data.category_type is not None:
        update_data["category_type"] = data.category_type.lower().strip()
    
    if data.active is not None:
        update_data["active"] = data.active
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await db.sizes.update_one({"size_id": size_id}, {"$set": update_data})
    
    # Get updated size
    updated = await db.sizes.find_one({"size_id": size_id}, {"_id": 0})
    
    return {"message": "Size updated successfully", "size": updated}


@router.delete("/{size_id}")
async def delete_size(request: Request, size_id: str):
    """Delete a size (Admin only) - prevents deletion if used in products"""
    await require_admin(request)
    
    # Find size
    size = await db.sizes.find_one({"size_id": size_id})
    if not size:
        raise HTTPException(status_code=404, detail="Size not found")
    
    size_name = size.get("name")
    
    # Check if size is used in any product
    product_using = await db.products.find_one({"sizes": size_name})
    if product_using:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete size '{size_name}' - it's used in product '{product_using.get('title')}'. Deactivate instead."
        )
    
    await db.sizes.delete_one({"size_id": size_id})
    
    return {"message": f"Size '{size_name}' deleted successfully"}


@router.post("/seed")
async def seed_default_sizes(request: Request):
    """Seed default sizes (Admin only)"""
    await require_admin(request)
    
    added = []
    skipped = []
    
    for size_data in DEFAULT_SIZES:
        # Check if already exists
        existing = await db.sizes.find_one({"name": size_data["name"]})
        if existing:
            skipped.append(size_data["name"])
            continue
        
        size_id = f"size_{uuid.uuid4().hex[:12]}"
        new_size = {
            "size_id": size_id,
            "name": size_data["name"],
            "category_type": size_data["category_type"],
            "active": True,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.sizes.insert_one(new_size)
        added.append(size_data["name"])
    
    return {
        "message": "Sizes seeded successfully",
        "added": added,
        "skipped": skipped,
        "added_count": len(added),
        "skipped_count": len(skipped)
    }


@router.put("/{size_id}/toggle")
async def toggle_size_active(request: Request, size_id: str):
    """Toggle size active status (Admin only)"""
    await require_admin(request)
    
    size = await db.sizes.find_one({"size_id": size_id})
    if not size:
        raise HTTPException(status_code=404, detail="Size not found")
    
    new_status = not size.get("active", True)
    
    await db.sizes.update_one(
        {"size_id": size_id},
        {"$set": {"active": new_status}}
    )
    
    return {
        "message": f"Size {'activated' if new_status else 'deactivated'} successfully",
        "active": new_status
    }
