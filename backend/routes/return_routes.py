from fastapi import APIRouter, HTTPException, Request
from auth import get_current_user, require_admin, db
from models import ReturnRequest, ReturnRequestCreate, ReturnStatus
from typing import List
import uuid
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

router = APIRouter(prefix="/api/returns", tags=["returns"])

# Return window in days
RETURN_WINDOW_DAYS = 7

@router.get("/check-eligibility/{order_id}")
async def check_return_eligibility(order_id: str, request: Request):
    """
    Check if an order is eligible for return.
    Returns eligibility status, days remaining, and any existing return request.
    """
    user = await get_current_user(request)
    
    # Get order
    order = await db.orders.find_one({
        "order_id": order_id,
        "user_id": user["user_id"]
    }, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check order status
    if order.get("order_status") != "delivered":
        return {
            "eligible": False,
            "reason": "Order not yet delivered",
            "order_status": order.get("order_status"),
            "return_status": order.get("return_status", "none")
        }
    
    # Check for existing return request
    existing_return = await db.return_requests.find_one({
        "order_id": order_id,
        "user_id": user["user_id"]
    }, {"_id": 0})
    
    if existing_return and existing_return.get("status") in ["approved", "completed"]:
        return {
            "eligible": False,
            "reason": "Return already processed for this order",
            "return_status": existing_return.get("status"),
            "return_request": existing_return
        }
    
    if existing_return and existing_return.get("status") == "requested":
        return {
            "eligible": False,
            "reason": "Return request already pending",
            "return_status": "requested",
            "return_request": existing_return
        }
    
    # Check return window (7 days from delivery)
    # Use updated_at as delivery timestamp (when status changed to delivered)
    delivery_date = order.get("updated_at")
    if isinstance(delivery_date, str):
        delivery_date = datetime.fromisoformat(delivery_date.replace('Z', '+00:00'))
    
    now = datetime.now(timezone.utc)
    if delivery_date.tzinfo is None:
        delivery_date = delivery_date.replace(tzinfo=timezone.utc)
    
    window_end = delivery_date + timedelta(days=RETURN_WINDOW_DAYS)
    days_remaining = (window_end - now).days
    
    if now > window_end:
        return {
            "eligible": False,
            "reason": "Return window closed",
            "window_days": RETURN_WINDOW_DAYS,
            "days_since_delivery": (now - delivery_date).days,
            "return_status": order.get("return_status", "none")
        }
    
    return {
        "eligible": True,
        "days_remaining": max(0, days_remaining),
        "window_end": window_end.isoformat(),
        "return_status": order.get("return_status", "none")
    }

@router.post("")
async def create_return_request(return_data: ReturnRequestCreate, request: Request):
    """
    Create a return/replace request for an order.
    Validates:
    - Order belongs to user
    - Order is delivered
    - Within 7-day return window
    - No existing approved/completed return
    """
    user = await get_current_user(request)
    
    # Verify order belongs to user
    order = await db.orders.find_one({
        "order_id": return_data.order_id,
        "user_id": user["user_id"]
    })
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check order status - must be delivered
    if order.get("order_status") != "delivered":
        raise HTTPException(status_code=400, detail="Only delivered orders can be returned")
    
    # Check for existing return request (approved or completed)
    existing_return = await db.return_requests.find_one({
        "order_id": return_data.order_id,
        "user_id": user["user_id"],
        "status": {"$in": ["requested", "approved", "completed"]}
    })
    
    if existing_return:
        raise HTTPException(status_code=400, detail="Return already requested for this order")
    
    # Check return window (7 days from delivery)
    delivery_date = order.get("updated_at")
    if isinstance(delivery_date, str):
        delivery_date = datetime.fromisoformat(delivery_date.replace('Z', '+00:00'))
    
    now = datetime.now(timezone.utc)
    if delivery_date.tzinfo is None:
        delivery_date = delivery_date.replace(tzinfo=timezone.utc)
    
    window_end = delivery_date + timedelta(days=RETURN_WINDOW_DAYS)
    
    if now > window_end:
        raise HTTPException(
            status_code=400, 
            detail=f"Return window has expired. Orders can only be returned within {RETURN_WINDOW_DAYS} days of delivery."
        )
    
    request_id = f"ret_{uuid.uuid4().hex[:12]}"
    
    return_request = {
        "request_id": request_id,
        "order_id": return_data.order_id,
        "user_id": user["user_id"],
        "items": [item.dict() for item in return_data.items],
        "reason": return_data.reason,
        "comments": return_data.comments,
        "images": return_data.images or [],
        "status": ReturnStatus.REQUESTED.value,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.return_requests.insert_one(return_request)
    
    # Update order return_status
    await db.orders.update_one(
        {"order_id": return_data.order_id},
        {"$set": {
            "return_status": ReturnStatus.REQUESTED.value,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    # Remove _id for response
    return_request.pop("_id", None)
    
    return return_request

@router.get("/my-requests")
async def get_my_return_requests(request: Request):
    """
    Get current user's return requests.
    """
    user = await get_current_user(request)
    
    requests = await db.return_requests.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return requests

# Admin endpoints
@router.get("/admin/all", response_model=List[ReturnRequest])
async def get_all_return_requests(
    request: Request,
    status: str = None,
    limit: int = 100
):
    """
    Get all return requests (Admin only).
    """
    await require_admin(request)
    
    query = {}
    if status:
        query["status"] = status
    
    requests = await db.return_requests.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return requests

class ReturnStatusUpdate(BaseModel):
    status: ReturnStatus
    admin_notes: str = None

@router.put("/admin/{request_id}/status")
async def update_return_status(request_id: str, data: ReturnStatusUpdate, request: Request):
    """
    Update return request status (Admin only).
    """
    await require_admin(request)
    
    # Get return request
    return_req = await db.return_requests.find_one({"request_id": request_id})
    if not return_req:
        raise HTTPException(status_code=404, detail="Return request not found")
    
    # Update return request
    update_data = {
        "status": data.status.value,
        "updated_at": datetime.now(timezone.utc)
    }
    if data.admin_notes:
        update_data["admin_notes"] = data.admin_notes
    
    await db.return_requests.update_one(
        {"request_id": request_id},
        {"$set": update_data}
    )
    
    # Update order return_status
    await db.orders.update_one(
        {"order_id": return_req["order_id"]},
        {"$set": {
            "return_status": data.status.value,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"message": "Return status updated"}
