from fastapi import APIRouter, HTTPException, Request
from auth import get_current_user, db
from models import CartItem, CartItemAdd, CartItemUpdate
from typing import List
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/cart", tags=["cart"])

@router.get("")
async def get_cart(request: Request):
    """
    Get current user's cart with product details.
    """
    user = await get_current_user(request)
    
    cart = await db.carts.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not cart:
        return {"cart_id": None, "user_id": user["user_id"], "items": []}
    
    # Enrich items with product details
    enriched_items = []
    for item in cart.get("items", []):
        product = await db.products.find_one(
            {"product_id": item["product_id"]},
            {"_id": 0}
        )
        if product:
            enriched_items.append({
                **item,
                "product": product
            })
    
    return {
        "cart_id": cart.get("cart_id"),
        "user_id": cart["user_id"],
        "items": enriched_items,
        "created_at": cart.get("created_at"),
        "updated_at": cart.get("updated_at")
    }

@router.post("/add")
async def add_to_cart(item_data: CartItemAdd, request: Request):
    """
    Add item to cart or update quantity if exists.
    """
    user = await get_current_user(request)
    
    # Verify product exists and check stock
    product = await db.products.find_one(
        {"product_id": item_data.product_id},
        {"_id": 0}
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if item_data.size not in product.get("sizes", []):
        raise HTTPException(status_code=400, detail="Size not available")
    
    if product.get("stock", 0) < item_data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # Get or create cart
    cart = await db.carts.find_one({"user_id": user["user_id"]})
    
    if not cart:
        # Create new cart
        cart = {
            "cart_id": f"cart_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "items": [{
                "product_id": item_data.product_id,
                "size": item_data.size,
                "quantity": item_data.quantity
            }],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.carts.insert_one(cart)
    else:
        # Check if item already exists
        existing_item = None
        for idx, item in enumerate(cart.get("items", [])):
            if item["product_id"] == item_data.product_id and item["size"] == item_data.size:
                existing_item = (idx, item)
                break
        
        if existing_item:
            # Update quantity
            idx, item = existing_item
            new_quantity = item["quantity"] + item_data.quantity
            if new_quantity > product.get("stock", 0):
                raise HTTPException(status_code=400, detail="Cannot add more than available stock")
            
            await db.carts.update_one(
                {"user_id": user["user_id"]},
                {
                    "$set": {
                        f"items.{idx}.quantity": new_quantity,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
        else:
            # Add new item
            await db.carts.update_one(
                {"user_id": user["user_id"]},
                {
                    "$push": {
                        "items": {
                            "product_id": item_data.product_id,
                            "size": item_data.size,
                            "quantity": item_data.quantity
                        }
                    },
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
    
    return {"message": "Item added to cart"}

@router.put("/update/{product_id}/{size}")
async def update_cart_item(
    product_id: str,
    size: str,
    update_data: CartItemUpdate,
    request: Request
):
    """
    Update item quantity in cart.
    """
    user = await get_current_user(request)
    
    if update_data.quantity < 1:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")
    
    # Verify product stock
    product = await db.products.find_one(
        {"product_id": product_id},
        {"_id": 0}
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if update_data.quantity > product.get("stock", 0):
        raise HTTPException(status_code=400, detail="Requested quantity exceeds available stock")
    
    cart = await db.carts.find_one({"user_id": user["user_id"]})
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Find and update item
    item_found = False
    for idx, item in enumerate(cart.get("items", [])):
        if item["product_id"] == product_id and item["size"] == size:
            await db.carts.update_one(
                {"user_id": user["user_id"]},
                {
                    "$set": {
                        f"items.{idx}.quantity": update_data.quantity,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            item_found = True
            break
    
    if not item_found:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    
    return {"message": "Cart updated"}

@router.delete("/remove/{product_id}/{size}")
async def remove_from_cart(product_id: str, size: str, request: Request):
    """
    Remove item from cart.
    """
    user = await get_current_user(request)
    
    result = await db.carts.update_one(
        {"user_id": user["user_id"]},
        {
            "$pull": {
                "items": {"product_id": product_id, "size": size}
            },
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    
    return {"message": "Item removed from cart"}

@router.delete("/clear")
async def clear_cart(request: Request):
    """
    Clear all items from cart.
    """
    user = await get_current_user(request)
    
    await db.carts.update_one(
        {"user_id": user["user_id"]},
        {
            "$set": {
                "items": [],
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"message": "Cart cleared"}

@router.get("/count")
async def get_cart_count(request: Request):
    """
    Get total items count in cart.
    """
    user = await get_current_user(request)
    
    cart = await db.carts.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "items": 1}
    )
    
    if not cart:
        return {"count": 0}
    
    total = sum(item.get("quantity", 0) for item in cart.get("items", []))
    return {"count": total}
