from fastapi import APIRouter, HTTPException, Request
from auth import get_current_user, db
from models import AddressCreate, AddressUpdate, UserProfileUpdate
import logging
import uuid
import re
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/user", tags=["user-profile"])

MAX_ADDRESSES = 5

def validate_phone(phone: str) -> bool:
    """Validate 10-digit Indian mobile number"""
    if not phone:
        return False
    # Remove any spaces or dashes
    phone = re.sub(r'[\s\-]', '', phone)
    # Check if it's exactly 10 digits
    return bool(re.match(r'^[6-9]\d{9}$', phone))

def validate_pincode(pincode: str) -> bool:
    """Validate 6-digit Indian pincode"""
    if not pincode:
        return False
    return bool(re.match(r'^[1-9]\d{5}$', pincode))


# =====================
# PROFILE ENDPOINTS
# =====================

@router.get("/profile")
async def get_profile(request: Request):
    """Get current user's profile"""
    user = await get_current_user(request)
    
    # Get full user data including addresses
    user_data = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "password": 0, "reset_password_token": 0, "reset_token_expiry": 0}
    )
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure addresses field exists
    if "addresses" not in user_data:
        user_data["addresses"] = []
    
    return user_data


@router.put("/profile")
async def update_profile(request: Request, data: UserProfileUpdate):
    """Update current user's profile (name, phone)"""
    user = await get_current_user(request)
    
    update_data = {}
    
    if data.name is not None:
        if len(data.name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
        update_data["name"] = data.name.strip()
    
    if data.phone is not None:
        if data.phone and not validate_phone(data.phone):
            raise HTTPException(status_code=400, detail="Invalid phone number. Must be 10-digit Indian mobile number")
        update_data["phone"] = data.phone
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    # Return updated user
    updated_user = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "password": 0, "reset_password_token": 0, "reset_token_expiry": 0}
    )
    
    return {"message": "Profile updated successfully", "user": updated_user}


# =====================
# ADDRESS ENDPOINTS
# =====================

@router.get("/addresses")
async def get_addresses(request: Request):
    """Get all addresses for current user"""
    user = await get_current_user(request)
    
    user_data = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "addresses": 1}
    )
    
    addresses = user_data.get("addresses", []) if user_data else []
    
    # Sort: default first, then by created_at
    addresses.sort(key=lambda x: (not x.get("is_default", False), x.get("created_at", "")))
    
    return {"addresses": addresses, "count": len(addresses), "max_allowed": MAX_ADDRESSES}


@router.post("/addresses")
async def add_address(request: Request, data: AddressCreate):
    """Add a new address (max 5)"""
    user = await get_current_user(request)
    
    # Validate phone
    if not validate_phone(data.phone):
        raise HTTPException(status_code=400, detail="Invalid phone number. Must be 10-digit Indian mobile number starting with 6-9")
    
    # Validate pincode
    if not validate_pincode(data.pincode):
        raise HTTPException(status_code=400, detail="Invalid pincode. Must be 6 digits")
    
    # Get current addresses
    user_data = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "addresses": 1}
    )
    
    current_addresses = user_data.get("addresses", []) if user_data else []
    
    # Check limit
    if len(current_addresses) >= MAX_ADDRESSES:
        raise HTTPException(
            status_code=400, 
            detail=f"You can save up to {MAX_ADDRESSES} addresses. Please delete an existing address first."
        )
    
    # Create new address
    address_id = f"addr_{uuid.uuid4().hex[:12]}"
    new_address = {
        "address_id": address_id,
        "label": data.label,
        "name": data.name.strip(),
        "phone": data.phone,
        "address_line1": data.address_line1.strip(),
        "address_line2": data.address_line2.strip() if data.address_line2 else None,
        "city": data.city.strip(),
        "state": data.state.strip(),
        "pincode": data.pincode,
        "is_default": data.is_default or len(current_addresses) == 0,  # First address is default
        "created_at": datetime.now(timezone.utc)
    }
    
    # If this is set as default, unset others
    if new_address["is_default"] and current_addresses:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"addresses.$[].is_default": False}}
        )
    
    # Add new address
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$push": {"addresses": new_address}}
    )
    
    return {"message": "Address added successfully", "address": new_address}


@router.put("/addresses/{address_id}")
async def update_address(request: Request, address_id: str, data: AddressUpdate):
    """Update an existing address"""
    user = await get_current_user(request)
    
    # Get user with addresses
    user_data = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "addresses": 1}
    )
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    addresses = user_data.get("addresses", [])
    
    # Find address
    address_index = next((i for i, addr in enumerate(addresses) if addr["address_id"] == address_id), None)
    
    if address_index is None:
        raise HTTPException(status_code=404, detail="Address not found")
    
    # Validate phone if provided
    if data.phone is not None and not validate_phone(data.phone):
        raise HTTPException(status_code=400, detail="Invalid phone number. Must be 10-digit Indian mobile number starting with 6-9")
    
    # Validate pincode if provided
    if data.pincode is not None and not validate_pincode(data.pincode):
        raise HTTPException(status_code=400, detail="Invalid pincode. Must be 6 digits")
    
    # Build update
    update_fields = {}
    if data.label is not None:
        update_fields[f"addresses.{address_index}.label"] = data.label
    if data.name is not None:
        update_fields[f"addresses.{address_index}.name"] = data.name.strip()
    if data.phone is not None:
        update_fields[f"addresses.{address_index}.phone"] = data.phone
    if data.address_line1 is not None:
        update_fields[f"addresses.{address_index}.address_line1"] = data.address_line1.strip()
    if data.address_line2 is not None:
        update_fields[f"addresses.{address_index}.address_line2"] = data.address_line2.strip() if data.address_line2 else None
    if data.city is not None:
        update_fields[f"addresses.{address_index}.city"] = data.city.strip()
    if data.state is not None:
        update_fields[f"addresses.{address_index}.state"] = data.state.strip()
    if data.pincode is not None:
        update_fields[f"addresses.{address_index}.pincode"] = data.pincode
    
    # Handle default setting
    if data.is_default is True:
        # First unset all defaults
        for i in range(len(addresses)):
            update_fields[f"addresses.{i}.is_default"] = False
        # Then set this one as default
        update_fields[f"addresses.{address_index}.is_default"] = True
    elif data.is_default is False:
        # Only allow unsetting if there are other addresses
        if len(addresses) > 1:
            update_fields[f"addresses.{address_index}.is_default"] = False
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_fields}
    )
    
    # Return updated address
    updated_user = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "addresses": 1}
    )
    updated_address = next((addr for addr in updated_user.get("addresses", []) if addr["address_id"] == address_id), None)
    
    return {"message": "Address updated successfully", "address": updated_address}


@router.delete("/addresses/{address_id}")
async def delete_address(request: Request, address_id: str):
    """Delete an address"""
    user = await get_current_user(request)
    
    # Get user with addresses
    user_data = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "addresses": 1}
    )
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    addresses = user_data.get("addresses", [])
    
    # Find address
    address_to_delete = next((addr for addr in addresses if addr["address_id"] == address_id), None)
    
    if not address_to_delete:
        raise HTTPException(status_code=404, detail="Address not found")
    
    was_default = address_to_delete.get("is_default", False)
    
    # Remove address
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$pull": {"addresses": {"address_id": address_id}}}
    )
    
    # If deleted address was default and there are remaining addresses, set first one as default
    if was_default and len(addresses) > 1:
        remaining_addresses = [addr for addr in addresses if addr["address_id"] != address_id]
        if remaining_addresses:
            await db.users.update_one(
                {"user_id": user["user_id"], "addresses.0": {"$exists": True}},
                {"$set": {"addresses.0.is_default": True}}
            )
    
    return {"message": "Address deleted successfully"}


@router.put("/addresses/{address_id}/set-default")
async def set_default_address(request: Request, address_id: str):
    """Set an address as the default"""
    user = await get_current_user(request)
    
    # Get user with addresses
    user_data = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "addresses": 1}
    )
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    addresses = user_data.get("addresses", [])
    
    # Find address index
    address_index = next((i for i, addr in enumerate(addresses) if addr["address_id"] == address_id), None)
    
    if address_index is None:
        raise HTTPException(status_code=404, detail="Address not found")
    
    # Unset all defaults and set the target
    update_fields = {}
    for i in range(len(addresses)):
        update_fields[f"addresses.{i}.is_default"] = (i == address_index)
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_fields}
    )
    
    return {"message": "Default address updated successfully"}
