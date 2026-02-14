from fastapi import APIRouter, HTTPException, Request
from auth import get_current_user, require_admin, db
from models import Order, OrderCreate, OrderStatus, PaymentStatus, PaymentMethod
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import os
import razorpay
from pydantic import BaseModel

router = APIRouter(prefix="/api/orders", tags=["orders"])

# Initialize Razorpay client (will use env vars in production)
try:
    razorpay_client = razorpay.Client(auth=(
        os.getenv('RAZORPAY_KEY_ID', 'mock_key_id'),
        os.getenv('RAZORPAY_KEY_SECRET', 'mock_key_secret')
    ))
except Exception as e:
    print(f"Razorpay client initialization warning: {e}")
    razorpay_client = None

class RazorpayOrderCreate(BaseModel):
    amount: int  # in paise

class RazorpayVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str

@router.post("/create-razorpay-order")
async def create_razorpay_order(data: RazorpayOrderCreate, request: Request):
    """
    Create Razorpay order for payment.
    """
    user = await get_current_user(request)
    
    # Mock response if Razorpay client not configured
    if not razorpay_client or os.getenv('RAZORPAY_KEY_ID', '').startswith('mock'):
        mock_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
        return {
            "id": mock_order_id,
            "amount": data.amount,
            "currency": "INR",
            "status": "created",
            "mock": True
        }
    
    try:
        razorpay_order = razorpay_client.order.create({
            "amount": data.amount,
            "currency": "INR",
            "payment_capture": 1
        })
        return razorpay_order
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Razorpay error: {str(e)}")

@router.post("/verify-payment")
async def verify_payment(data: RazorpayVerification, request: Request):
    """
    Verify Razorpay payment signature.
    """
    user = await get_current_user(request)
    
    # Skip verification for mock payments
    if data.razorpay_order_id.startswith('order_mock'):
        # Update order payment status
        await db.orders.update_one(
            {"order_id": data.order_id, "user_id": user["user_id"]},
            {"$set": {
                "payment_status": PaymentStatus.SUCCESS.value,
                "razorpay_order_id": data.razorpay_order_id,
                "razorpay_payment_id": data.razorpay_payment_id,
                "order_status": OrderStatus.CONFIRMED.value,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        return {"verified": True, "mock": True}
    
    try:
        # Verify signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        })
        
        # Update order
        await db.orders.update_one(
            {"order_id": data.order_id, "user_id": user["user_id"]},
            {"$set": {
                "payment_status": PaymentStatus.SUCCESS.value,
                "razorpay_order_id": data.razorpay_order_id,
                "razorpay_payment_id": data.razorpay_payment_id,
                "razorpay_signature": data.razorpay_signature,
                "order_status": OrderStatus.CONFIRMED.value,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        return {"verified": True}
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")

@router.post("", response_model=Order)
async def create_order(order_data: OrderCreate, request: Request):
    """
    Create new order.
    """
    user = await get_current_user(request)
    
    # Validate pincode
    pincode_data = await db.pincodes.find_one(
        {"pincode": order_data.pincode},
        {"_id": 0}
    )
    
    if not pincode_data:
        raise HTTPException(status_code=400, detail="Delivery not available for this pincode")
    
    # Check COD availability
    if order_data.payment_method == PaymentMethod.COD and not pincode_data["cod_available"]:
        raise HTTPException(status_code=400, detail="COD not available for this pincode")
    
    # Calculate totals
    subtotal = sum(item.subtotal for item in order_data.items)
    
    # Get GST settings
    gst_settings = await db.gst_settings.find_one({}, {"_id": 0})
    gst_percentage = gst_settings["gst_percentage"] if gst_settings else 18.0
    gst_amount = round(subtotal * (gst_percentage / 100), 2)
    
    shipping_charge = pincode_data["shipping_charge"] if subtotal < 999 else 0
    total = subtotal + gst_amount + shipping_charge
    
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    
    # For COD, set payment_status as pending, order_status as confirmed
    # For Razorpay, set payment_status as pending, order_status as pending (will confirm after payment)
    payment_status = PaymentStatus.PENDING.value
    order_status = OrderStatus.CONFIRMED.value if order_data.payment_method == PaymentMethod.COD else OrderStatus.PENDING.value
    
    order = {
        "order_id": order_id,
        "user_id": user["user_id"],
        "items": [item.dict() for item in order_data.items],
        "subtotal": subtotal,
        "gst_amount": gst_amount,
        "shipping_charge": shipping_charge,
        "total": total,
        "payment_method": order_data.payment_method.value,
        "payment_status": payment_status,
        "order_status": order_status,
        "delivery_address": order_data.delivery_address,
        "pincode": order_data.pincode,
        "return_status": "none",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.orders.insert_one(order)
    
    # Reduce stock for each item
    for item in order_data.items:
        await db.products.update_one(
            {"product_id": item.product_id},
            {
                "$inc": {
                    "stock": -item.quantity,
                    "sales_count": item.quantity
                }
            }
        )
    
    return order

@router.get("", response_model=List[Order])
async def get_my_orders(request: Request):
    """
    Get current user's orders.
    """
    user = await get_current_user(request)
    
    orders = await db.orders.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return orders

@router.get("/{order_id}", response_model=Order)
async def get_order(order_id: str, request: Request):
    """
    Get specific order details.
    """
    user = await get_current_user(request)
    
    order = await db.orders.find_one(
        {"order_id": order_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

# Admin endpoints
@router.get("/admin/all", response_model=List[Order])
async def get_all_orders(
    request: Request,
    status: Optional[str] = None,
    limit: int = 100
):
    """
    Get all orders (Admin only).
    """
    await require_admin(request)
    
    query = {}
    if status:
        query["order_status"] = status
    
    orders = await db.orders.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return orders

class OrderStatusUpdate(BaseModel):
    order_status: OrderStatus

class TrackingUpdate(BaseModel):
    tracking_id: str
    courier: str

@router.put("/admin/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, request: Request):
    """
    Update order status (Admin only).
    """
    await require_admin(request)
    
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "order_status": data.order_status.value,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

@router.put("/admin/{order_id}/tracking")
async def update_tracking(order_id: str, data: TrackingUpdate, request: Request):
    """
    Add tracking ID and courier (Admin only).
    """
    await require_admin(request)
    
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "tracking_id": data.tracking_id,
            "courier": data.courier,
            "order_status": OrderStatus.SHIPPED.value,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Tracking details updated"}
