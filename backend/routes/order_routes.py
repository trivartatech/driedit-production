from fastapi import APIRouter, HTTPException, Request
from auth import get_current_user, require_admin, db
from models import Order, OrderCreate, OrderStatus, PaymentStatus, PaymentMethod
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import os
import razorpay
from pydantic import BaseModel
import logging
import asyncio

# Email service import
from services.email_service import (
    send_order_confirmation,
    send_order_shipped,
    send_order_delivered
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/orders", tags=["orders"])

# Initialize Razorpay client (will use env vars in production)
razorpay_key_id = os.getenv('RAZORPAY_KEY_ID', '')
razorpay_key_secret = os.getenv('RAZORPAY_KEY_SECRET', '')

# Only initialize Razorpay client if real keys are provided
razorpay_client = None
razorpay_mode = "mock"

if razorpay_key_id and razorpay_key_secret:
    try:
        razorpay_client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
        razorpay_mode = "test" if razorpay_key_id.startswith('rzp_test_') else "live"
        logger.info(f"Razorpay client initialized in {razorpay_mode} mode")
    except Exception as e:
        logger.error(f"Razorpay client initialization error: {e}")
        razorpay_client = None
        razorpay_mode = "mock"
else:
    logger.info("Razorpay client not initialized - using mock mode (no keys configured)")

class RazorpayOrderCreate(BaseModel):
    amount: int  # in paise

class RazorpayVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str

@router.get("/payment-config")
async def get_payment_config():
    """
    Get payment configuration status (public endpoint for frontend).
    Only returns the key_id (safe to expose) and mode status.
    """
    return {
        "razorpay_enabled": razorpay_client is not None,
        "razorpay_mode": razorpay_mode,
        "razorpay_key_id": razorpay_key_id if razorpay_client else None,
        "cod_enabled": True
    }

@router.post("/create-razorpay-order")
async def create_razorpay_order(data: RazorpayOrderCreate, request: Request):
    """
    Create Razorpay order for payment.
    Returns mock order if Razorpay is not configured.
    """
    user = await get_current_user(request)
    
    # Validate amount (minimum ₹1 = 100 paise)
    if data.amount < 100:
        raise HTTPException(status_code=400, detail="Minimum order amount is ₹1")
    
    # Mock response if Razorpay client not configured
    if not razorpay_client:
        mock_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
        logger.info(f"Created mock Razorpay order: {mock_order_id}")
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
            "payment_capture": 1,
            "notes": {
                "user_id": user["user_id"]
            }
        })
        logger.info(f"Created Razorpay order: {razorpay_order['id']} for amount: {data.amount}")
        return razorpay_order
    except razorpay.errors.BadRequestError as e:
        logger.error(f"Razorpay bad request: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid request: {str(e)}")
    except Exception as e:
        logger.error(f"Razorpay order creation error: {e}")
        raise HTTPException(status_code=500, detail="Payment service temporarily unavailable")

@router.post("/verify-payment")
async def verify_payment(data: RazorpayVerification, request: Request):
    """
    Verify Razorpay payment signature.
    CRITICAL: This ensures payment was actually made before marking order as paid.
    """
    user = await get_current_user(request)
    
    # Verify order exists and belongs to user
    order = await db.orders.find_one({
        "order_id": data.order_id,
        "user_id": user["user_id"]
    })
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if already verified (prevent replay attacks)
    if order.get("payment_status") == PaymentStatus.SUCCESS.value:
        logger.warning(f"Payment already verified for order: {data.order_id}")
        return {"verified": True, "message": "Payment already verified"}
    
    # Handle mock payments (for development/testing without real keys)
    if data.razorpay_order_id.startswith('order_mock'):
        logger.info(f"Mock payment verification for order: {data.order_id}")
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
        
        # Send confirmation email (non-blocking)
        updated_order = await db.orders.find_one({"order_id": data.order_id}, {"_id": 0})
        if updated_order:
            asyncio.create_task(send_order_confirmation(updated_order, user.get("email", "")))
        
        return {"verified": True, "mock": True}
    
    # REAL PAYMENT VERIFICATION
    if not razorpay_client:
        raise HTTPException(
            status_code=500, 
            detail="Payment verification unavailable - Razorpay not configured"
        )
    
    try:
        # Verify signature - this is CRITICAL for security
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        })
        
        logger.info(f"Payment verified successfully: {data.razorpay_payment_id} for order: {data.order_id}")
        
        # Update order with verified payment details
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
        
        # Send confirmation email (non-blocking)
        updated_order = await db.orders.find_one({"order_id": data.order_id}, {"_id": 0})
        if updated_order:
            asyncio.create_task(send_order_confirmation(updated_order, user.get("email", "")))
        
        return {"verified": True, "payment_id": data.razorpay_payment_id}
        
    except razorpay.errors.SignatureVerificationError:
        logger.error(f"Invalid payment signature for order: {data.order_id}")
        # Mark payment as failed
        await db.orders.update_one(
            {"order_id": data.order_id},
            {"$set": {
                "payment_status": PaymentStatus.FAILED.value,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        raise HTTPException(status_code=400, detail="Invalid payment signature - payment not verified")
    except Exception as e:
        logger.error(f"Payment verification error: {e}")
        raise HTTPException(status_code=500, detail="Payment verification failed")

@router.post("", response_model=Order)
async def create_order(order_data: OrderCreate, request: Request):
    """
    Create new order.
    
    Pricing Order (Industry Standard):
    1. Calculate base subtotal
    2. Apply coupon discount
    3. Calculate GST on discounted subtotal
    4. Calculate shipping (tier-based on discounted subtotal)
    5. Final total
    
    Note: Shipping is never discounted.
    """
    user = await get_current_user(request)
    
    # Validate pincode (for COD availability only)
    pincode_data = await db.pincodes.find_one(
        {"pincode": order_data.pincode},
        {"_id": 0}
    )
    
    if not pincode_data:
        raise HTTPException(status_code=400, detail="Delivery not available for this pincode")
    
    if order_data.payment_method == PaymentMethod.COD and not pincode_data["cod_available"]:
        raise HTTPException(status_code=400, detail="COD not available for this pincode")
    
    # 1. Calculate base subtotal
    subtotal = sum(item.subtotal for item in order_data.items)
    
    # 2. Apply coupon discount (if provided)
    coupon_code = order_data.coupon_code
    coupon_discount = order_data.coupon_discount if order_data.coupon_discount else 0
    applied_type = order_data.coupon_applied_type if hasattr(order_data, 'coupon_applied_type') else "manual"
    
    # Re-validate coupon at order creation to prevent abuse
    if coupon_code and coupon_discount > 0:
        coupon = await db.coupons.find_one({"code": coupon_code.upper()}, {"_id": 0})
        if not coupon or not coupon.get("is_active"):
            coupon_code = None
            coupon_discount = 0
        else:
            # Verify discount matches
            from routes.coupon_routes import calculate_discount, check_coupon_eligibility
            eligible, _ = await check_coupon_eligibility(coupon, user["user_id"], subtotal)
            if not eligible:
                coupon_code = None
                coupon_discount = 0
            else:
                # Recalculate discount
                coupon_discount = calculate_discount(coupon, subtotal)
    
    # Discounted subtotal (base for GST and shipping)
    discounted_subtotal = subtotal - coupon_discount
    if discounted_subtotal < 0:
        discounted_subtotal = 0
    
    # 3. Calculate GST on discounted subtotal
    gst_settings = await db.gst_settings.find_one({}, {"_id": 0})
    gst_percentage = gst_settings["gst_percentage"] if gst_settings else 18.0
    gst_amount = round(discounted_subtotal * (gst_percentage / 100), 2)
    
    # 4. Calculate shipping using tier system (based on discounted subtotal)
    shipping_tier = await db.shipping_tiers.find_one({
        "is_active": True,
        "min_amount": {"$lte": discounted_subtotal},
        "$or": [
            {"max_amount": {"$gte": discounted_subtotal}},
            {"max_amount": None}
        ]
    }, {"_id": 0})
    
    shipping_charge = shipping_tier["shipping_charge"] if shipping_tier else 0
    
    # 5. Final total
    total = discounted_subtotal + gst_amount + shipping_charge
    
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    
    payment_status = PaymentStatus.PENDING.value
    order_status = OrderStatus.CONFIRMED.value if order_data.payment_method == PaymentMethod.COD else OrderStatus.PENDING.value
    
    order = {
        "order_id": order_id,
        "user_id": user["user_id"],
        "items": [item.dict() for item in order_data.items],
        "subtotal": subtotal,  # Original subtotal before discount
        "discounted_subtotal": discounted_subtotal,
        "gst_amount": gst_amount,
        "gst_percentage": gst_percentage,
        "shipping_charge": shipping_charge,
        "coupon_code": coupon_code,
        "coupon_discount": coupon_discount,
        "coupon_applied_type": applied_type,
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
    
    # Record coupon usage if applied
    if coupon_code and coupon_discount > 0:
        coupon = await db.coupons.find_one({"code": coupon_code.upper()})
        if coupon:
            usage = {
                "usage_id": f"usage_{uuid.uuid4().hex[:12]}",
                "coupon_id": coupon["coupon_id"],
                "coupon_code": coupon_code.upper(),
                "user_id": user["user_id"],
                "order_id": order_id,
                "discount_amount": coupon_discount,
                "order_subtotal": subtotal,
                "applied_type": applied_type,
                "used_at": datetime.now(timezone.utc)
            }
            await db.coupon_usage.insert_one(usage)
            await db.coupons.update_one(
                {"coupon_id": coupon["coupon_id"]},
                {"$inc": {"used_count": 1}}
            )
    
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
    Sends email notifications for shipped/delivered status changes.
    """
    await require_admin(request)
    
    # Get current order to check for status change
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.get("order_status")
    new_status = data.order_status.value
    
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "order_status": new_status,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    # Send email notification for status changes
    if old_status != new_status:
        # Get user email
        user = await db.users.find_one({"user_id": order.get("user_id")}, {"_id": 0, "email": 1})
        user_email = user.get("email") if user else None
        
        if user_email:
            updated_order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
            
            if new_status == OrderStatus.SHIPPED.value:
                asyncio.create_task(send_order_shipped(updated_order, user_email))
                logger.info(f"Shipping notification queued for {order_id}")
            elif new_status == OrderStatus.DELIVERED.value:
                asyncio.create_task(send_order_delivered(updated_order, user_email))
                logger.info(f"Delivery notification queued for {order_id}")
    
    return {"message": "Order status updated"}

@router.put("/admin/{order_id}/tracking")
async def update_tracking(order_id: str, data: TrackingUpdate, request: Request):
    """
    Add tracking ID and courier (Admin only).
    Automatically marks order as shipped and sends notification.
    """
    await require_admin(request)
    
    # Get current order
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "tracking_id": data.tracking_id,
            "courier": data.courier,
            "order_status": OrderStatus.SHIPPED.value,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    # Send shipping notification email
    user = await db.users.find_one({"user_id": order.get("user_id")}, {"_id": 0, "email": 1})
    if user and user.get("email"):
        updated_order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
        asyncio.create_task(send_order_shipped(updated_order, user.get("email")))
        logger.info(f"Shipping notification queued for {order_id}")
    
    return {"message": "Tracking details updated"}
