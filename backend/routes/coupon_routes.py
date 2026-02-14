"""
Coupon System Routes
Full-featured discount coupon system with:
- Percentage and fixed discounts
- Auto-apply for marketing campaigns
- Manual entry for influencer/affiliate codes
- No stacking - best auto coupon or user choice
"""
from fastapi import APIRouter, HTTPException, Request
from auth import get_current_user, require_admin, db
from models import Coupon, CouponCreate, CouponType, CouponUsage
from typing import Optional, List
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/coupons", tags=["coupons"])


class CouponApplyRequest(BaseModel):
    code: str
    order_total: float


class CouponUpdateRequest(BaseModel):
    code: Optional[str] = None
    coupon_type: Optional[CouponType] = None
    discount_value: Optional[float] = None
    min_order_value: Optional[float] = None
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    one_time_per_user: Optional[bool] = None
    auto_apply: Optional[bool] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


def calculate_discount(coupon: dict, subtotal: float) -> float:
    """Calculate discount amount for a coupon given subtotal."""
    discount_value = coupon.get("discount_value", 0)
    coupon_type = coupon.get("coupon_type")
    
    if coupon_type == CouponType.PERCENTAGE.value:
        discount_amount = (subtotal * discount_value) / 100
        max_discount = coupon.get("max_discount")
        if max_discount and discount_amount > max_discount:
            discount_amount = max_discount
    else:  # FIXED
        discount_amount = min(discount_value, subtotal)
    
    return round(discount_amount, 2)


async def check_coupon_eligibility(coupon: dict, user_id: str, subtotal: float) -> tuple[bool, str]:
    """
    Check if a coupon is eligible for a user and order.
    Returns (is_eligible, error_message).
    """
    # Check if active
    if not coupon.get("is_active", False):
        return False, "Coupon is not active"
    
    # Check expiry
    expires_at = coupon.get("expires_at")
    if expires_at:
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        exp_dt = expires_at.replace(tzinfo=timezone.utc) if expires_at.tzinfo is None else expires_at
        if datetime.now(timezone.utc) > exp_dt:
            return False, "Coupon has expired"
    
    # Check usage limit
    usage_limit = coupon.get("usage_limit")
    if usage_limit and coupon.get("used_count", 0) >= usage_limit:
        return False, "Coupon usage limit reached"
    
    # Check one-time per user
    if coupon.get("one_time_per_user", True):
        existing_usage = await db.coupon_usage.find_one({
            "coupon_id": coupon["coupon_id"],
            "user_id": user_id
        })
        if existing_usage:
            return False, "Already used this coupon"
    
    # Check minimum order value
    min_order = coupon.get("min_order_value", 0)
    if subtotal < min_order:
        return False, f"Minimum order ₹{min_order:.0f} required"
    
    return True, ""


# ============================================
# PUBLIC ENDPOINTS
# ============================================

@router.get("/auto-apply")
async def get_best_auto_coupon(subtotal: float, request: Request):
    """
    Get the best auto-apply coupon for the given subtotal.
    Returns the coupon with highest discount among eligible auto-apply coupons.
    """
    user = await get_current_user(request)
    
    if subtotal <= 0:
        return {"coupon": None, "message": "Invalid subtotal"}
    
    # Find all active auto-apply coupons
    coupons = await db.coupons.find({
        "is_active": True,
        "auto_apply": True,
        "min_order_value": {"$lte": subtotal}
    }, {"_id": 0}).to_list(50)
    
    best_coupon = None
    best_discount = 0
    
    for coupon in coupons:
        # Check eligibility
        eligible, _ = await check_coupon_eligibility(coupon, user["user_id"], subtotal)
        if not eligible:
            continue
        
        # Calculate discount
        discount = calculate_discount(coupon, subtotal)
        
        if discount > best_discount:
            best_discount = discount
            best_coupon = coupon
    
    if best_coupon:
        return {
            "coupon": {
                "code": best_coupon["code"],
                "coupon_type": best_coupon["coupon_type"],
                "discount_value": best_coupon["discount_value"],
                "discount_amount": best_discount,
                "max_discount": best_coupon.get("max_discount"),
                "auto_apply": True
            },
            "message": f"Auto-applied: {best_coupon['code']} saves ₹{best_discount:.0f}"
        }
    
    return {"coupon": None, "message": "No auto-apply coupons available"}


@router.post("/validate")
async def validate_coupon(data: CouponApplyRequest, request: Request):
    """
    Validate and calculate discount for a coupon code.
    Works for both manual and auto-apply coupons.
    """
    user = await get_current_user(request)
    code = data.code.strip().upper()
    
    coupon = await db.coupons.find_one({"code": code}, {"_id": 0})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    # Check eligibility
    eligible, error_msg = await check_coupon_eligibility(coupon, user["user_id"], data.order_total)
    if not eligible:
        raise HTTPException(status_code=400, detail=error_msg)
    
    discount_amount = calculate_discount(coupon, data.order_total)
    new_total = round(data.order_total - discount_amount, 2)
    
    return {
        "valid": True,
        "coupon_code": code,
        "coupon_type": coupon["coupon_type"],
        "discount_value": coupon["discount_value"],
        "discount_amount": discount_amount,
        "max_discount": coupon.get("max_discount"),
        "auto_apply": coupon.get("auto_apply", False),
        "original_total": data.order_total,
        "new_total": new_total,
        "message": f"Coupon applied! You save ₹{discount_amount:.0f}"
    }


@router.post("/apply")
async def apply_coupon_to_order(
    code: str,
    order_id: str,
    order_subtotal: float,
    applied_type: str = "manual",
    request: Request = None
):
    """
    Apply coupon to an order (called internally during order creation).
    Records usage and returns discount amount.
    applied_type: "manual" or "auto"
    """
    user = await get_current_user(request)
    code = code.strip().upper()
    
    # Validate coupon
    validation_request = CouponApplyRequest(code=code, order_total=order_subtotal)
    validation = await validate_coupon(validation_request, request)
    
    coupon = await db.coupons.find_one({"code": code}, {"_id": 0})
    
    # Record usage with atomic increment
    usage = {
        "usage_id": f"usage_{uuid.uuid4().hex[:12]}",
        "coupon_id": coupon["coupon_id"],
        "coupon_code": code,
        "user_id": user["user_id"],
        "order_id": order_id,
        "discount_amount": validation["discount_amount"],
        "order_subtotal": order_subtotal,
        "applied_type": applied_type,
        "used_at": datetime.now(timezone.utc)
    }
    await db.coupon_usage.insert_one(usage)
    
    # Atomic increment to prevent race condition
    await db.coupons.update_one(
        {"coupon_id": coupon["coupon_id"]},
        {"$inc": {"used_count": 1}}
    )
    
    logger.info(f"Coupon {code} ({applied_type}) applied to order {order_id}, discount: {validation['discount_amount']}")
    
    return {
        "applied": True,
        "discount_amount": validation["discount_amount"],
        "new_total": validation["new_total"]
    }


# ============================================
# ADMIN ENDPOINTS
# ============================================

@router.post("/admin/create")
async def create_coupon(data: CouponCreate, request: Request):
    """Create a new coupon (Admin only)."""
    await require_admin(request)
    
    code = data.code.strip().upper()
    
    if await db.coupons.find_one({"code": code}):
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    if data.coupon_type == CouponType.PERCENTAGE and (data.discount_value < 0 or data.discount_value > 100):
        raise HTTPException(status_code=400, detail="Percentage discount must be between 0 and 100")
    
    if data.discount_value < 0:
        raise HTTPException(status_code=400, detail="Discount value cannot be negative")
    
    coupon = {
        "coupon_id": f"coupon_{uuid.uuid4().hex[:12]}",
        "code": code,
        "coupon_type": data.coupon_type.value,
        "discount_value": data.discount_value,
        "min_order_value": data.min_order_value,
        "max_discount": data.max_discount,
        "usage_limit": data.usage_limit,
        "used_count": 0,
        "one_time_per_user": data.one_time_per_user,
        "auto_apply": data.auto_apply,
        "is_active": data.is_active,
        "expires_at": data.expires_at,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.coupons.insert_one(coupon)
    coupon.pop("_id", None)
    
    logger.info(f"Created coupon: {code} (auto_apply={data.auto_apply})")
    return coupon


@router.get("/admin/all")
async def get_all_coupons(request: Request, include_inactive: bool = True):
    """Get all coupons with usage stats (Admin only)."""
    await require_admin(request)
    
    query = {} if include_inactive else {"is_active": True}
    coupons = await db.coupons.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for coupon in coupons:
        # Get usage stats with revenue
        pipeline = [
            {"$match": {"coupon_id": coupon["coupon_id"]}},
            {"$group": {
                "_id": None,
                "total_discount": {"$sum": "$discount_amount"},
                "total_revenue": {"$sum": "$order_subtotal"},
                "total_uses": {"$sum": 1},
                "auto_uses": {"$sum": {"$cond": [{"$eq": ["$applied_type", "auto"]}, 1, 0]}},
                "manual_uses": {"$sum": {"$cond": [{"$eq": ["$applied_type", "manual"]}, 1, 0]}}
            }}
        ]
        stats = await db.coupon_usage.aggregate(pipeline).to_list(1)
        
        if stats:
            coupon["total_discount_given"] = stats[0].get("total_discount", 0)
            coupon["total_revenue"] = stats[0].get("total_revenue", 0)
            coupon["redemption_count"] = stats[0].get("total_uses", 0)
            coupon["auto_uses"] = stats[0].get("auto_uses", 0)
            coupon["manual_uses"] = stats[0].get("manual_uses", 0)
        else:
            coupon["total_discount_given"] = 0
            coupon["total_revenue"] = 0
            coupon["redemption_count"] = 0
            coupon["auto_uses"] = 0
            coupon["manual_uses"] = 0
        
        # Check if expired
        if coupon.get("expires_at"):
            expires = coupon["expires_at"]
            if isinstance(expires, str):
                expires = datetime.fromisoformat(expires.replace('Z', '+00:00'))
            coupon["is_expired"] = datetime.now(timezone.utc) > (expires.replace(tzinfo=timezone.utc) if expires.tzinfo is None else expires)
        else:
            coupon["is_expired"] = False
    
    return coupons


@router.get("/admin/{coupon_id}")
async def get_coupon_details(coupon_id: str, request: Request):
    """Get coupon details with full usage history (Admin only)."""
    await require_admin(request)
    
    coupon = await db.coupons.find_one({"coupon_id": coupon_id}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Get usage history
    usage_history = await db.coupon_usage.find(
        {"coupon_id": coupon_id},
        {"_id": 0}
    ).sort("used_at", -1).to_list(100)
    
    # Enrich with user info
    for usage in usage_history:
        user = await db.users.find_one(
            {"user_id": usage["user_id"]},
            {"_id": 0, "email": 1, "name": 1}
        )
        if user:
            usage["user_email"] = user.get("email")
            usage["user_name"] = user.get("name")
    
    # Calculate stats
    total_discount = sum(u.get("discount_amount", 0) for u in usage_history)
    total_revenue = sum(u.get("order_subtotal", 0) for u in usage_history)
    auto_uses = len([u for u in usage_history if u.get("applied_type") == "auto"])
    manual_uses = len([u for u in usage_history if u.get("applied_type") == "manual"])
    
    return {
        **coupon,
        "total_discount_given": total_discount,
        "total_revenue": total_revenue,
        "auto_uses": auto_uses,
        "manual_uses": manual_uses,
        "usage_history": usage_history
    }


@router.put("/admin/{coupon_id}")
async def update_coupon(coupon_id: str, data: CouponUpdateRequest, request: Request):
    """Update coupon details (Admin only)."""
    await require_admin(request)
    
    coupon = await db.coupons.find_one({"coupon_id": coupon_id})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    update_data = {}
    
    if data.code is not None:
        code = data.code.strip().upper()
        existing = await db.coupons.find_one({"code": code, "coupon_id": {"$ne": coupon_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Coupon code already exists")
        update_data["code"] = code
    
    if data.coupon_type is not None:
        update_data["coupon_type"] = data.coupon_type.value
    
    if data.discount_value is not None:
        if data.coupon_type == CouponType.PERCENTAGE and (data.discount_value < 0 or data.discount_value > 100):
            raise HTTPException(status_code=400, detail="Percentage discount must be between 0 and 100")
        update_data["discount_value"] = data.discount_value
    
    if data.min_order_value is not None:
        update_data["min_order_value"] = data.min_order_value
    
    if data.max_discount is not None:
        update_data["max_discount"] = data.max_discount
    
    if data.usage_limit is not None:
        update_data["usage_limit"] = data.usage_limit
    
    if data.one_time_per_user is not None:
        update_data["one_time_per_user"] = data.one_time_per_user
    
    if data.auto_apply is not None:
        update_data["auto_apply"] = data.auto_apply
    
    if data.is_active is not None:
        update_data["is_active"] = data.is_active
    
    if data.expires_at is not None:
        update_data["expires_at"] = data.expires_at
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.coupons.update_one(
            {"coupon_id": coupon_id},
            {"$set": update_data}
        )
    
    updated = await db.coupons.find_one({"coupon_id": coupon_id}, {"_id": 0})
    return updated


@router.delete("/admin/{coupon_id}")
async def delete_coupon(coupon_id: str, request: Request):
    """Delete a coupon (Admin only)."""
    await require_admin(request)
    
    result = await db.coupons.delete_one({"coupon_id": coupon_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Also delete usage history
    await db.coupon_usage.delete_many({"coupon_id": coupon_id})
    
    return {"message": "Coupon deleted successfully"}


@router.put("/admin/{coupon_id}/toggle")
async def toggle_coupon_status(coupon_id: str, request: Request):
    """Toggle coupon active/inactive status (Admin only)."""
    await require_admin(request)
    
    coupon = await db.coupons.find_one({"coupon_id": coupon_id})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    new_status = not coupon.get("is_active", True)
    
    await db.coupons.update_one(
        {"coupon_id": coupon_id},
        {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"is_active": new_status, "message": f"Coupon {'activated' if new_status else 'deactivated'}"}
