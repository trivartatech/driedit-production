"""
Shipping Tier Routes
Tier-based shipping calculation system.
Shipping is calculated based on subtotal (before GST).
"""
from fastapi import APIRouter, HTTPException, Request
from auth import require_admin, db
from models import ShippingTier, ShippingTierCreate, ShippingTierUpdate
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/shipping-tiers", tags=["shipping"])


async def validate_tier_ranges(new_tier: dict, exclude_tier_id: str = None):
    """
    Validate that the new tier doesn't overlap with existing tiers.
    Returns error message if validation fails, None if valid.
    """
    query = {"is_active": True}
    if exclude_tier_id:
        query["tier_id"] = {"$ne": exclude_tier_id}
    
    existing_tiers = await db.shipping_tiers.find(query, {"_id": 0}).to_list(100)
    
    new_min = new_tier["min_amount"]
    new_max = new_tier.get("max_amount")
    
    for tier in existing_tiers:
        tier_min = tier["min_amount"]
        tier_max = tier.get("max_amount")
        
        # Check for overlap
        # Case 1: New tier starts within existing tier
        if tier_max is None:
            if new_min >= tier_min:
                return f"Overlaps with tier starting at ₹{tier_min}"
        else:
            if tier_min <= new_min <= tier_max:
                return f"Overlaps with tier ₹{tier_min} - ₹{tier_max}"
        
        # Case 2: New tier ends within existing tier
        if new_max is not None:
            if tier_max is None:
                if new_max >= tier_min:
                    return f"Overlaps with tier starting at ₹{tier_min}"
            else:
                if tier_min <= new_max <= tier_max:
                    return f"Overlaps with tier ₹{tier_min} - ₹{tier_max}"
        
        # Case 3: New tier completely contains existing tier
        if new_max is None:
            if tier_min >= new_min:
                return f"Overlaps with tier starting at ₹{tier_min}"
        else:
            if tier_max is not None:
                if new_min <= tier_min and new_max >= tier_max:
                    return f"Contains tier ₹{tier_min} - ₹{tier_max}"
    
    return None


# ============================================
# PUBLIC ENDPOINTS
# ============================================

@router.get("/calculate")
async def calculate_shipping(subtotal: float):
    """
    Calculate shipping charge based on subtotal (before GST).
    Public endpoint for checkout.
    """
    if subtotal < 0:
        raise HTTPException(status_code=400, detail="Subtotal cannot be negative")
    
    # Find matching active tier
    tier = await db.shipping_tiers.find_one({
        "is_active": True,
        "min_amount": {"$lte": subtotal},
        "$or": [
            {"max_amount": {"$gte": subtotal}},
            {"max_amount": None}
        ]
    }, {"_id": 0})
    
    if not tier:
        # No matching tier - return default shipping
        logger.warning(f"No shipping tier found for subtotal: {subtotal}")
        return {
            "subtotal": subtotal,
            "shipping_charge": 0,
            "tier_matched": False,
            "message": "Free shipping (no tier configured)"
        }
    
    shipping_charge = tier["shipping_charge"]
    
    return {
        "subtotal": subtotal,
        "shipping_charge": shipping_charge,
        "tier_matched": True,
        "tier_id": tier["tier_id"],
        "tier_range": f"₹{tier['min_amount']}" + (f" - ₹{tier['max_amount']}" if tier.get('max_amount') else "+"),
        "message": "Free shipping" if shipping_charge == 0 else f"Shipping: ₹{shipping_charge}"
    }


@router.get("/all-active")
async def get_active_tiers():
    """
    Get all active shipping tiers (for display on frontend).
    Public endpoint.
    """
    tiers = await db.shipping_tiers.find(
        {"is_active": True},
        {"_id": 0}
    ).sort("min_amount", 1).to_list(100)
    
    return tiers


# ============================================
# ADMIN ENDPOINTS
# ============================================

@router.get("/admin/all")
async def get_all_tiers(request: Request):
    """Get all shipping tiers including inactive (Admin only)."""
    await require_admin(request)
    
    tiers = await db.shipping_tiers.find(
        {},
        {"_id": 0}
    ).sort("min_amount", 1).to_list(100)
    
    return tiers


@router.post("/admin/create")
async def create_tier(data: ShippingTierCreate, request: Request):
    """Create a new shipping tier (Admin only)."""
    await require_admin(request)
    
    # Validate amounts
    if data.min_amount < 0:
        raise HTTPException(status_code=400, detail="Min amount cannot be negative")
    
    if data.max_amount is not None and data.max_amount <= data.min_amount:
        raise HTTPException(status_code=400, detail="Max amount must be greater than min amount")
    
    if data.shipping_charge < 0:
        raise HTTPException(status_code=400, detail="Shipping charge cannot be negative")
    
    # Validate no overlap
    tier_data = {
        "min_amount": data.min_amount,
        "max_amount": data.max_amount,
        "shipping_charge": data.shipping_charge,
        "is_active": data.is_active
    }
    
    if data.is_active:
        overlap_error = await validate_tier_ranges(tier_data)
        if overlap_error:
            raise HTTPException(status_code=400, detail=f"Tier range overlap: {overlap_error}")
    
    tier = {
        "tier_id": f"tier_{uuid.uuid4().hex[:12]}",
        **tier_data,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.shipping_tiers.insert_one(tier)
    tier.pop("_id", None)
    
    logger.info(f"Created shipping tier: {tier['tier_id']} (₹{data.min_amount} - ₹{data.max_amount or 'unlimited'})")
    return tier


@router.put("/admin/{tier_id}")
async def update_tier(tier_id: str, data: ShippingTierUpdate, request: Request):
    """Update a shipping tier (Admin only)."""
    await require_admin(request)
    
    existing = await db.shipping_tiers.find_one({"tier_id": tier_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Shipping tier not found")
    
    update_data = {}
    
    if data.min_amount is not None:
        if data.min_amount < 0:
            raise HTTPException(status_code=400, detail="Min amount cannot be negative")
        update_data["min_amount"] = data.min_amount
    
    if data.max_amount is not None:
        update_data["max_amount"] = data.max_amount
    
    if data.shipping_charge is not None:
        if data.shipping_charge < 0:
            raise HTTPException(status_code=400, detail="Shipping charge cannot be negative")
        update_data["shipping_charge"] = data.shipping_charge
    
    if data.is_active is not None:
        update_data["is_active"] = data.is_active
    
    # Validate max > min
    new_min = update_data.get("min_amount", existing["min_amount"])
    new_max = update_data.get("max_amount", existing.get("max_amount"))
    if new_max is not None and new_max <= new_min:
        raise HTTPException(status_code=400, detail="Max amount must be greater than min amount")
    
    # Validate no overlap if becoming active or changing range
    is_active = update_data.get("is_active", existing.get("is_active", True))
    if is_active and (data.min_amount is not None or data.max_amount is not None):
        tier_data = {
            "min_amount": new_min,
            "max_amount": new_max
        }
        overlap_error = await validate_tier_ranges(tier_data, exclude_tier_id=tier_id)
        if overlap_error:
            raise HTTPException(status_code=400, detail=f"Tier range overlap: {overlap_error}")
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.shipping_tiers.update_one(
            {"tier_id": tier_id},
            {"$set": update_data}
        )
    
    updated = await db.shipping_tiers.find_one({"tier_id": tier_id}, {"_id": 0})
    return updated


@router.delete("/admin/{tier_id}")
async def delete_tier(tier_id: str, request: Request):
    """Delete a shipping tier (Admin only)."""
    await require_admin(request)
    
    result = await db.shipping_tiers.delete_one({"tier_id": tier_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shipping tier not found")
    
    logger.info(f"Deleted shipping tier: {tier_id}")
    return {"message": "Shipping tier deleted successfully"}


@router.put("/admin/{tier_id}/toggle")
async def toggle_tier(tier_id: str, request: Request):
    """Toggle shipping tier active status (Admin only)."""
    await require_admin(request)
    
    tier = await db.shipping_tiers.find_one({"tier_id": tier_id})
    if not tier:
        raise HTTPException(status_code=404, detail="Shipping tier not found")
    
    new_status = not tier.get("is_active", True)
    
    # If activating, check for overlap
    if new_status:
        tier_data = {
            "min_amount": tier["min_amount"],
            "max_amount": tier.get("max_amount")
        }
        overlap_error = await validate_tier_ranges(tier_data, exclude_tier_id=tier_id)
        if overlap_error:
            raise HTTPException(status_code=400, detail=f"Cannot activate - range overlap: {overlap_error}")
    
    await db.shipping_tiers.update_one(
        {"tier_id": tier_id},
        {"$set": {
            "is_active": new_status,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"is_active": new_status, "message": f"Tier {'activated' if new_status else 'deactivated'}"}
