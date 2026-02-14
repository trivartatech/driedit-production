"""
Analytics Routes for DRIEDIT Admin Dashboard
Provides business intelligence metrics using MongoDB aggregation pipelines.
"""
from fastapi import APIRouter, HTTPException, Request
from auth import require_admin, db
from datetime import datetime, timezone, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/analytics", tags=["analytics"])


def get_date_range(days: int) -> tuple[datetime, datetime]:
    """Get start and end datetime for a given number of days."""
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    return start, end


@router.get("/overview")
async def get_analytics_overview(request: Request):
    """
    Get revenue and order overview metrics.
    Returns: today, 7 days, 30 days, and lifetime stats.
    """
    await require_admin(request)
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    
    # Aggregation pipeline for revenue stats
    async def get_period_stats(start_date: Optional[datetime] = None):
        match_stage = {"payment_status": "success"}
        if start_date:
            match_stage["created_at"] = {"$gte": start_date}
        
        pipeline = [
            {"$match": match_stage},
            {"$group": {
                "_id": None,
                "total_revenue": {"$sum": "$total"},
                "total_orders": {"$sum": 1},
                "total_items": {"$sum": {"$size": "$items"}}
            }}
        ]
        
        result = await db.orders.aggregate(pipeline).to_list(1)
        if result:
            return {
                "revenue": round(result[0]["total_revenue"], 2),
                "orders": result[0]["total_orders"],
                "items": result[0]["total_items"]
            }
        return {"revenue": 0, "orders": 0, "items": 0}
    
    # Get stats for each period
    today_stats = await get_period_stats(today_start)
    week_stats = await get_period_stats(week_start)
    month_stats = await get_period_stats(month_start)
    lifetime_stats = await get_period_stats(None)
    
    # Calculate AOV
    def calc_aov(stats):
        if stats["orders"] > 0:
            return round(stats["revenue"] / stats["orders"], 2)
        return 0
    
    return {
        "today": {**today_stats, "aov": calc_aov(today_stats)},
        "week": {**week_stats, "aov": calc_aov(week_stats)},
        "month": {**month_stats, "aov": calc_aov(month_stats)},
        "lifetime": {**lifetime_stats, "aov": calc_aov(lifetime_stats)},
        "generated_at": now.isoformat()
    }


@router.get("/revenue-chart")
async def get_revenue_chart(request: Request, days: int = 30):
    """
    Get daily revenue data for chart visualization.
    Returns revenue and order count per day for the last N days.
    """
    await require_admin(request)
    
    if days > 90:
        days = 90  # Cap at 90 days
    
    start_date, end_date = get_date_range(days)
    
    pipeline = [
        {
            "$match": {
                "payment_status": "success",
                "created_at": {"$gte": start_date, "$lte": end_date}
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                },
                "revenue": {"$sum": "$total"},
                "orders": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    results = await db.orders.aggregate(pipeline).to_list(days)
    
    # Fill in missing days with zeros
    date_map = {r["_id"]: r for r in results}
    chart_data = []
    
    current = start_date
    while current <= end_date:
        date_str = current.strftime("%Y-%m-%d")
        if date_str in date_map:
            chart_data.append({
                "date": date_str,
                "revenue": round(date_map[date_str]["revenue"], 2),
                "orders": date_map[date_str]["orders"]
            })
        else:
            chart_data.append({
                "date": date_str,
                "revenue": 0,
                "orders": 0
            })
        current += timedelta(days=1)
    
    return {"data": chart_data, "days": days}


@router.get("/products")
async def get_top_products(request: Request, limit: int = 5):
    """
    Get top performing products by revenue and quantity sold.
    """
    await require_admin(request)
    
    if limit > 20:
        limit = 20
    
    # Top products by revenue
    revenue_pipeline = [
        {"$match": {"payment_status": "success"}},
        {"$unwind": "$items"},
        {
            "$group": {
                "_id": "$items.product_id",
                "product_title": {"$first": "$items.product_title"},
                "total_revenue": {"$sum": "$items.subtotal"},
                "quantity_sold": {"$sum": "$items.quantity"}
            }
        },
        {"$sort": {"total_revenue": -1}},
        {"$limit": limit}
    ]
    
    # Top products by quantity
    quantity_pipeline = [
        {"$match": {"payment_status": "success"}},
        {"$unwind": "$items"},
        {
            "$group": {
                "_id": "$items.product_id",
                "product_title": {"$first": "$items.product_title"},
                "total_revenue": {"$sum": "$items.subtotal"},
                "quantity_sold": {"$sum": "$items.quantity"}
            }
        },
        {"$sort": {"quantity_sold": -1}},
        {"$limit": limit}
    ]
    
    by_revenue = await db.orders.aggregate(revenue_pipeline).to_list(limit)
    by_quantity = await db.orders.aggregate(quantity_pipeline).to_list(limit)
    
    # Clean up results
    for item in by_revenue + by_quantity:
        item["product_id"] = item.pop("_id")
        item["total_revenue"] = round(item["total_revenue"], 2)
    
    return {
        "by_revenue": by_revenue,
        "by_quantity": by_quantity
    }


@router.get("/coupons")
async def get_coupon_analytics(request: Request):
    """
    Get coupon performance metrics.
    """
    await require_admin(request)
    
    # Orders with coupons
    coupon_pipeline = [
        {"$match": {"payment_status": "success"}},
        {
            "$group": {
                "_id": None,
                "total_orders": {"$sum": 1},
                "orders_with_coupon": {
                    "$sum": {"$cond": [{"$gt": ["$coupon_discount", 0]}, 1, 0]}
                },
                "total_discount": {"$sum": {"$ifNull": ["$coupon_discount", 0]}},
                "revenue_with_coupon": {
                    "$sum": {
                        "$cond": [
                            {"$gt": ["$coupon_discount", 0]},
                            "$total",
                            0
                        ]
                    }
                },
                "total_revenue": {"$sum": "$total"}
            }
        }
    ]
    
    result = await db.orders.aggregate(coupon_pipeline).to_list(1)
    
    if result:
        stats = result[0]
        usage_rate = (stats["orders_with_coupon"] / stats["total_orders"] * 100) if stats["total_orders"] > 0 else 0
        
        return {
            "total_discount_given": round(stats["total_discount"], 2),
            "revenue_with_coupon": round(stats["revenue_with_coupon"], 2),
            "revenue_without_coupon": round(stats["total_revenue"] - stats["revenue_with_coupon"], 2),
            "orders_with_coupon": stats["orders_with_coupon"],
            "total_orders": stats["total_orders"],
            "coupon_usage_rate": round(usage_rate, 1)
        }
    
    return {
        "total_discount_given": 0,
        "revenue_with_coupon": 0,
        "revenue_without_coupon": 0,
        "orders_with_coupon": 0,
        "total_orders": 0,
        "coupon_usage_rate": 0
    }


@router.get("/conversion")
async def get_conversion_metrics(request: Request):
    """
    Get basic conversion funnel metrics.
    """
    await require_admin(request)
    
    # Get cart count (carts that exist)
    total_carts = await db.carts.count_documents({})
    
    # Get active carts (with items)
    active_carts = await db.carts.count_documents({"items": {"$ne": []}})
    
    # Get order counts by status
    order_pipeline = [
        {
            "$group": {
                "_id": "$payment_status",
                "count": {"$sum": 1}
            }
        }
    ]
    
    order_stats = await db.orders.aggregate(order_pipeline).to_list(10)
    status_map = {s["_id"]: s["count"] for s in order_stats}
    
    completed_orders = status_map.get("success", 0)
    pending_orders = status_map.get("pending", 0)
    failed_orders = status_map.get("failed", 0)
    total_checkout_attempts = completed_orders + pending_orders + failed_orders
    
    # Calculate conversion rate
    checkout_conversion = (completed_orders / total_checkout_attempts * 100) if total_checkout_attempts > 0 else 0
    cart_to_order = (total_checkout_attempts / active_carts * 100) if active_carts > 0 else 0
    
    return {
        "total_carts": total_carts,
        "active_carts": active_carts,
        "checkout_attempts": total_checkout_attempts,
        "completed_orders": completed_orders,
        "pending_orders": pending_orders,
        "failed_orders": failed_orders,
        "checkout_success_rate": round(checkout_conversion, 1),
        "cart_to_checkout_rate": round(cart_to_order, 1)
    }


@router.get("/customers")
async def get_customer_metrics(request: Request):
    """
    Get customer-related metrics.
    """
    await require_admin(request)
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = today_start - timedelta(days=30)
    
    # Total customers
    total_customers = await db.users.count_documents({"role": "user"})
    
    # New customers this month
    new_customers_month = await db.users.count_documents({
        "role": "user",
        "created_at": {"$gte": month_start}
    })
    
    # New customers today
    new_customers_today = await db.users.count_documents({
        "role": "user",
        "created_at": {"$gte": today_start}
    })
    
    # Customers with orders
    customers_with_orders = await db.orders.distinct("user_id", {"payment_status": "success"})
    
    # Repeat customers (more than 1 order)
    repeat_pipeline = [
        {"$match": {"payment_status": "success"}},
        {"$group": {"_id": "$user_id", "order_count": {"$sum": 1}}},
        {"$match": {"order_count": {"$gt": 1}}},
        {"$count": "repeat_customers"}
    ]
    
    repeat_result = await db.orders.aggregate(repeat_pipeline).to_list(1)
    repeat_customers = repeat_result[0]["repeat_customers"] if repeat_result else 0
    
    return {
        "total_customers": total_customers,
        "new_customers_today": new_customers_today,
        "new_customers_month": new_customers_month,
        "customers_with_orders": len(customers_with_orders),
        "repeat_customers": repeat_customers,
        "repeat_rate": round(repeat_customers / len(customers_with_orders) * 100, 1) if customers_with_orders else 0
    }
