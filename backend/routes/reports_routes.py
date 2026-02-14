from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from auth import require_admin, db
from datetime import datetime, timezone, timedelta
from typing import Optional
import io
import csv

router = APIRouter(prefix="/api/admin/reports", tags=["reports"])


@router.get("/gst")
async def get_gst_report(
    request: Request,
    from_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Get GST Report with breakdown of taxable value, GST collected, shipping, and gross revenue.
    Admin only.
    """
    await require_admin(request)
    
    # Build date filter
    date_filter = {"order_status": {"$nin": ["cancelled"]}}
    
    if from_date:
        start = datetime.strptime(from_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        date_filter["created_at"] = {"$gte": start}
    
    if to_date:
        end = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        if "created_at" in date_filter:
            date_filter["created_at"]["$lte"] = end
        else:
            date_filter["created_at"] = {"$lte": end}
    
    # Aggregate GST data
    pipeline = [
        {"$match": date_filter},
        {"$group": {
            "_id": None,
            "total_orders": {"$sum": 1},
            "total_subtotal": {"$sum": "$subtotal"},
            "total_discount": {"$sum": {"$ifNull": ["$coupon_discount", 0]}},
            "total_gst": {"$sum": "$gst_amount"},
            "total_shipping": {"$sum": "$shipping_charge"},
            "total_revenue": {"$sum": "$total"}
        }}
    ]
    
    result = await db.orders.aggregate(pipeline).to_list(1)
    
    if not result:
        return {
            "total_orders": 0,
            "taxable_value": 0,
            "total_discount": 0,
            "gst_collected": 0,
            "shipping_collected": 0,
            "gross_revenue": 0,
            "from_date": from_date,
            "to_date": to_date
        }
    
    data = result[0]
    taxable_value = data["total_subtotal"] - data["total_discount"]
    
    # Get GST settings for reference
    gst_settings = await db.settings.find_one({"type": "gst"})
    gst_percentage = gst_settings.get("gst_percentage", 18) if gst_settings else 18
    
    return {
        "total_orders": data["total_orders"],
        "taxable_value": round(taxable_value, 2),
        "total_discount": round(data["total_discount"], 2),
        "gst_percentage": gst_percentage,
        "gst_collected": round(data["total_gst"], 2),
        "shipping_collected": round(data["total_shipping"], 2),
        "gross_revenue": round(data["total_revenue"], 2),
        "from_date": from_date,
        "to_date": to_date
    }


@router.get("/sales")
async def get_sales_report(
    request: Request,
    from_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Get Sales Report with revenue, discounts, refunds, net revenue, AOV, and top products.
    Admin only.
    """
    await require_admin(request)
    
    # Build date filter for completed orders
    date_filter = {"order_status": {"$nin": ["cancelled"]}}
    
    if from_date:
        start = datetime.strptime(from_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        date_filter["created_at"] = {"$gte": start}
    
    if to_date:
        end = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        if "created_at" in date_filter:
            date_filter["created_at"]["$lte"] = end
        else:
            date_filter["created_at"] = {"$lte": end}
    
    # Sales aggregation
    sales_pipeline = [
        {"$match": date_filter},
        {"$group": {
            "_id": None,
            "total_orders": {"$sum": 1},
            "total_revenue": {"$sum": "$total"},
            "total_subtotal": {"$sum": "$subtotal"},
            "total_discount": {"$sum": {"$ifNull": ["$coupon_discount", 0]}},
            "total_gst": {"$sum": "$gst_amount"},
            "total_shipping": {"$sum": "$shipping_charge"}
        }}
    ]
    
    sales_result = await db.orders.aggregate(sales_pipeline).to_list(1)
    
    # Refunds aggregation (completed returns)
    refund_filter = {"status": "completed"}
    if from_date:
        refund_filter["created_at"] = {"$gte": start}
    if to_date:
        if "created_at" in refund_filter:
            refund_filter["created_at"]["$lte"] = end
        else:
            refund_filter["created_at"] = {"$lte": end}
    
    # Get refund amounts from orders with completed returns
    refund_pipeline = [
        {"$match": {"return_status": "completed", **({k: v for k, v in date_filter.items() if k != "order_status"})}},
        {"$group": {
            "_id": None,
            "total_refunds": {"$sum": "$total"},
            "refund_count": {"$sum": 1}
        }}
    ]
    
    refund_result = await db.orders.aggregate(refund_pipeline).to_list(1)
    
    # Top products
    top_products_pipeline = [
        {"$match": date_filter},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product_id",
            "product_title": {"$first": "$items.product_title"},
            "total_quantity": {"$sum": "$items.quantity"},
            "total_revenue": {"$sum": "$items.subtotal"}
        }},
        {"$sort": {"total_revenue": -1}},
        {"$limit": 5}
    ]
    
    top_products = await db.orders.aggregate(top_products_pipeline).to_list(5)
    
    # Daily breakdown
    daily_pipeline = [
        {"$match": date_filter},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "orders": {"$sum": 1},
            "revenue": {"$sum": "$total"}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    daily_data = await db.orders.aggregate(daily_pipeline).to_list(100)
    
    # Calculate values
    if sales_result:
        data = sales_result[0]
        total_orders = data["total_orders"]
        total_revenue = data["total_revenue"]
        total_discount = data["total_discount"]
        aov = total_revenue / total_orders if total_orders > 0 else 0
    else:
        total_orders = 0
        total_revenue = 0
        total_discount = 0
        aov = 0
    
    total_refunds = refund_result[0]["total_refunds"] if refund_result else 0
    refund_count = refund_result[0]["refund_count"] if refund_result else 0
    net_revenue = total_revenue - total_refunds
    
    return {
        "total_orders": total_orders,
        "gross_revenue": round(total_revenue, 2),
        "total_discount": round(total_discount, 2),
        "total_refunds": round(total_refunds, 2),
        "refund_count": refund_count,
        "net_revenue": round(net_revenue, 2),
        "aov": round(aov, 2),
        "top_products": [
            {
                "product_id": p["_id"],
                "title": p["product_title"],
                "quantity": p["total_quantity"],
                "revenue": round(p["total_revenue"], 2)
            } for p in top_products
        ],
        "daily_breakdown": [
            {"date": d["_id"], "orders": d["orders"], "revenue": round(d["revenue"], 2)}
            for d in daily_data
        ],
        "from_date": from_date,
        "to_date": to_date
    }


@router.get("/payments")
async def get_payment_report(
    request: Request,
    from_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Get Payment Method breakdown report.
    Admin only.
    """
    await require_admin(request)
    
    # Build date filter
    date_filter = {"order_status": {"$nin": ["cancelled"]}, "payment_status": "success"}
    
    if from_date:
        start = datetime.strptime(from_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        date_filter["created_at"] = {"$gte": start}
    
    if to_date:
        end = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        if "created_at" in date_filter:
            date_filter["created_at"]["$lte"] = end
        else:
            date_filter["created_at"] = {"$lte": end}
    
    # Payment method aggregation
    pipeline = [
        {"$match": date_filter},
        {"$group": {
            "_id": "$payment_method",
            "order_count": {"$sum": 1},
            "total_revenue": {"$sum": "$total"}
        }},
        {"$sort": {"total_revenue": -1}}
    ]
    
    result = await db.orders.aggregate(pipeline).to_list(10)
    
    total_revenue = sum(r["total_revenue"] for r in result)
    
    payment_breakdown = []
    for r in result:
        method = r["_id"]
        method_label = "Razorpay" if method == "razorpay" else "Cash on Delivery" if method == "cod" else method.upper()
        percentage = (r["total_revenue"] / total_revenue * 100) if total_revenue > 0 else 0
        
        payment_breakdown.append({
            "method": method,
            "label": method_label,
            "order_count": r["order_count"],
            "revenue": round(r["total_revenue"], 2),
            "percentage": round(percentage, 1)
        })
    
    return {
        "total_revenue": round(total_revenue, 2),
        "payment_breakdown": payment_breakdown,
        "from_date": from_date,
        "to_date": to_date
    }


@router.get("/export/gst")
async def export_gst_report(
    request: Request,
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    format: str = Query("csv", description="Export format: csv or excel")
):
    """
    Export GST Report as CSV.
    Admin only.
    """
    await require_admin(request)
    
    # Build date filter
    date_filter = {"order_status": {"$nin": ["cancelled"]}}
    
    if from_date:
        start = datetime.strptime(from_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        date_filter["created_at"] = {"$gte": start}
    
    if to_date:
        end = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        if "created_at" in date_filter:
            date_filter["created_at"]["$lte"] = end
        else:
            date_filter["created_at"] = {"$lte": end}
    
    # Get all orders for export
    orders = await db.orders.find(date_filter, {"_id": 0}).sort("created_at", -1).to_list(10000)
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Order ID",
        "Order Date",
        "Customer Name",
        "State",
        "Subtotal",
        "Discount",
        "Taxable Value",
        "GST %",
        "GST Amount",
        "Shipping",
        "Total",
        "Payment Method",
        "Payment Status",
        "Order Status"
    ])
    
    # Get GST settings
    gst_settings = await db.settings.find_one({"type": "gst"})
    gst_percentage = gst_settings.get("gst_percentage", 18) if gst_settings else 18
    
    # Data rows
    for order in orders:
        address = order.get("delivery_address", {})
        taxable_value = order.get("subtotal", 0) - order.get("coupon_discount", 0)
        
        writer.writerow([
            order.get("order_id", ""),
            order.get("created_at", "").strftime("%Y-%m-%d %H:%M") if order.get("created_at") else "",
            address.get("name", ""),
            address.get("state", ""),
            order.get("subtotal", 0),
            order.get("coupon_discount", 0),
            round(taxable_value, 2),
            gst_percentage,
            order.get("gst_amount", 0),
            order.get("shipping_charge", 0),
            order.get("total", 0),
            order.get("payment_method", ""),
            order.get("payment_status", ""),
            order.get("order_status", "")
        ])
    
    output.seek(0)
    
    filename = f"gst_report_{from_date or 'all'}_{to_date or 'all'}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/sales")
async def export_sales_report(
    request: Request,
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None)
):
    """
    Export Sales Report as CSV.
    Admin only.
    """
    await require_admin(request)
    
    # Build date filter
    date_filter = {"order_status": {"$nin": ["cancelled"]}}
    
    if from_date:
        start = datetime.strptime(from_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        date_filter["created_at"] = {"$gte": start}
    
    if to_date:
        end = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        if "created_at" in date_filter:
            date_filter["created_at"]["$lte"] = end
        else:
            date_filter["created_at"] = {"$lte": end}
    
    # Get all orders
    orders = await db.orders.find(date_filter, {"_id": 0}).sort("created_at", -1).to_list(10000)
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Order ID",
        "Order Date",
        "Customer Name",
        "Email",
        "Phone",
        "Address",
        "City",
        "State",
        "Pincode",
        "Products",
        "Quantity",
        "Subtotal",
        "Coupon Code",
        "Discount",
        "GST",
        "Shipping",
        "Total",
        "Payment Method",
        "Payment Status",
        "Order Status",
        "Return Status"
    ])
    
    for order in orders:
        address = order.get("delivery_address", {})
        items = order.get("items", [])
        products = ", ".join([f"{item.get('product_title', '')} ({item.get('size', '')})" for item in items])
        total_qty = sum(item.get("quantity", 0) for item in items)
        
        # Get user email
        user = await db.users.find_one({"user_id": order.get("user_id")}, {"email": 1})
        email = user.get("email", "") if user else ""
        
        writer.writerow([
            order.get("order_id", ""),
            order.get("created_at", "").strftime("%Y-%m-%d %H:%M") if order.get("created_at") else "",
            address.get("name", ""),
            email,
            address.get("phone", ""),
            f"{address.get('address_line1', '')} {address.get('address_line2', '')}".strip(),
            address.get("city", ""),
            address.get("state", ""),
            order.get("pincode", ""),
            products,
            total_qty,
            order.get("subtotal", 0),
            order.get("coupon_code", ""),
            order.get("coupon_discount", 0),
            order.get("gst_amount", 0),
            order.get("shipping_charge", 0),
            order.get("total", 0),
            order.get("payment_method", ""),
            order.get("payment_status", ""),
            order.get("order_status", ""),
            order.get("return_status", "none")
        ])
    
    output.seek(0)
    
    filename = f"sales_report_{from_date or 'all'}_{to_date or 'all'}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/summary")
async def get_report_summary(request: Request):
    """
    Get quick summary of all reports for dashboard.
    Admin only.
    """
    await require_admin(request)
    
    # Current month
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # This month's data
    month_filter = {
        "order_status": {"$nin": ["cancelled"]},
        "created_at": {"$gte": month_start}
    }
    
    pipeline = [
        {"$match": month_filter},
        {"$group": {
            "_id": None,
            "total_orders": {"$sum": 1},
            "total_revenue": {"$sum": "$total"},
            "total_gst": {"$sum": "$gst_amount"}
        }}
    ]
    
    result = await db.orders.aggregate(pipeline).to_list(1)
    
    if result:
        data = result[0]
        return {
            "current_month": now.strftime("%B %Y"),
            "orders": data["total_orders"],
            "revenue": round(data["total_revenue"], 2),
            "gst_collected": round(data["total_gst"], 2)
        }
    
    return {
        "current_month": now.strftime("%B %Y"),
        "orders": 0,
        "revenue": 0,
        "gst_collected": 0
    }
