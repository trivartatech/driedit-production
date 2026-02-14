from fastapi import APIRouter, HTTPException, Request
from auth import get_current_user, require_admin, db
from models import ReturnRequest, ReturnRequestCreate, ReturnStatus
from typing import List
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel

router = APIRouter(prefix="/api/returns", tags=["returns"])

@router.post("", response_model=ReturnRequest)
async def create_return_request(return_data: ReturnRequestCreate, request: Request):
    """
    Create a return/replace request for an order.
    """
    user = await get_current_user(request)
    
    # Verify order belongs to user
    order = await db.orders.find_one({
        "order_id": return_data.order_id,
        "user_id": user["user_id"]
    })
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if return already requested
    if order.get("return_status") and order["return_status"] != "none":
        raise HTTPException(status_code=400, detail="Return already requested for this order")
    
    request_id = f"ret_{uuid.uuid4().hex[:12]}"
    
    return_request = {
        "request_id": request_id,
        "order_id": return_data.order_id,
        "user_id": user["user_id"],
        "reason": return_data.reason,
        "image": return_data.image,
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
            "return_reason": return_data.reason,
            "return_image": return_data.image,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return return_request

@router.get("/my-requests", response_model=List[ReturnRequest])
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
