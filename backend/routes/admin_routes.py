from fastapi import APIRouter, HTTPException, Request
from auth import require_admin, db
from models import Pincode, PincodeCreate, GSTSettings, HeroBanner, HeroBannerCreate, Popup, PopupCreate
from typing import List
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Pincode Management
@router.get("/pincodes", response_model=List[Pincode])
async def get_pincodes(request: Request):
    """
    Get all serviceable pincodes (Admin only).
    """
    await require_admin(request)
    
    pincodes = await db.pincodes.find({}, {"_id": 0}).to_list(1000)
    return pincodes

@router.post("/pincodes", response_model=Pincode)
async def create_pincode(pincode_data: PincodeCreate, request: Request):
    """
    Add serviceable pincode (Admin only).
    """
    await require_admin(request)
    
    # Check if already exists
    existing = await db.pincodes.find_one({"pincode": pincode_data.pincode})
    if existing:
        raise HTTPException(status_code=400, detail="Pincode already exists")
    
    pincode = {
        "pincode": pincode_data.pincode,
        "shipping_charge": pincode_data.shipping_charge,
        "cod_available": pincode_data.cod_available,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.pincodes.insert_one(pincode)
    return pincode

@router.put("/pincodes/{pincode}")
async def update_pincode(pincode: str, pincode_data: PincodeCreate, request: Request):
    """
    Update pincode details (Admin only).
    """
    await require_admin(request)
    
    result = await db.pincodes.update_one(
        {"pincode": pincode},
        {"$set": {
            "shipping_charge": pincode_data.shipping_charge,
            "cod_available": pincode_data.cod_available
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pincode not found")
    
    return {"message": "Pincode updated"}

@router.delete("/pincodes/{pincode}")
async def delete_pincode(pincode: str, request: Request):
    """
    Remove serviceable pincode (Admin only).
    """
    await require_admin(request)
    
    result = await db.pincodes.delete_one({"pincode": pincode})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pincode not found")
    
    return {"message": "Pincode removed"}

# GST Management
@router.get("/gst", response_model=GSTSettings)
async def get_gst_settings(request: Request):
    """
    Get GST settings (Admin only).
    """
    await require_admin(request)
    
    settings = await db.gst_settings.find_one({}, {"_id": 0})
    if not settings:
        # Create default
        settings = {"gst_percentage": 18.0, "updated_at": datetime.now(timezone.utc)}
        await db.gst_settings.insert_one(settings)
    
    return settings

@router.put("/gst")
async def update_gst_settings(gst_percentage: float, request: Request):
    """
    Update GST percentage (Admin only).
    """
    await require_admin(request)
    
    await db.gst_settings.update_one(
        {},
        {"$set": {
            "gst_percentage": gst_percentage,
            "updated_at": datetime.now(timezone.utc)
        }},
        upsert=True
    )
    
    return {"message": "GST settings updated"}

# Hero Banner Management
@router.get("/banners", response_model=List[HeroBanner])
async def get_banners(request: Request):
    """
    Get all hero banners (Admin only).
    """
    await require_admin(request)
    
    banners = await db.hero_banners.find({}, {"_id": 0}).sort("order_position", 1).to_list(100)
    return banners

@router.post("/banners", response_model=HeroBanner)
async def create_banner(banner_data: HeroBannerCreate, request: Request):
    """
    Create hero banner (Admin only).
    """
    await require_admin(request)
    
    banner_id = f"banner_{uuid.uuid4().hex[:12]}"
    
    banner = {
        "banner_id": banner_id,
        "image": banner_data.image,
        "button_text": banner_data.button_text,
        "redirect_url": banner_data.redirect_url,
        "active": banner_data.active,
        "order_position": banner_data.order_position,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.hero_banners.insert_one(banner)
    return banner

@router.put("/banners/{banner_id}")
async def update_banner(banner_id: str, banner_data: HeroBannerCreate, request: Request):
    """
    Update hero banner (Admin only).
    """
    await require_admin(request)
    
    result = await db.hero_banners.update_one(
        {"banner_id": banner_id},
        {"$set": banner_data.dict()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    return {"message": "Banner updated"}

@router.delete("/banners/{banner_id}")
async def delete_banner(banner_id: str, request: Request):
    """
    Delete hero banner (Admin only).
    """
    await require_admin(request)
    
    result = await db.hero_banners.delete_one({"banner_id": banner_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    return {"message": "Banner deleted"}

# Popup Management
@router.get("/popups", response_model=List[Popup])
async def get_popups(request: Request):
    """
    Get all popups (Admin only).
    """
    await require_admin(request)
    
    popups = await db.popups.find({}, {"_id": 0}).to_list(100)
    return popups

@router.post("/popups", response_model=Popup)
async def create_popup(popup_data: PopupCreate, request: Request):
    """
    Create popup (Admin only).
    """
    await require_admin(request)
    
    popup_id = f"popup_{uuid.uuid4().hex[:12]}"
    
    popup = {
        "popup_id": popup_id,
        "title": popup_data.title,
        "description": popup_data.description,
        "image": popup_data.image,
        "button_text": popup_data.button_text,
        "redirect_url": popup_data.redirect_url,
        "active": popup_data.active,
        "display_type": popup_data.display_type,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.popups.insert_one(popup)
    return popup

@router.put("/popups/{popup_id}")
async def update_popup(popup_id: str, popup_data: PopupCreate, request: Request):
    """
    Update popup (Admin only).
    """
    await require_admin(request)
    
    result = await db.popups.update_one(
        {"popup_id": popup_id},
        {"$set": popup_data.dict()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Popup not found")
    
    return {"message": "Popup updated"}

@router.delete("/popups/{popup_id}")
async def delete_popup(popup_id: str, request: Request):
    """
    Delete popup (Admin only).
    """
    await require_admin(request)
    
    result = await db.popups.delete_one({"popup_id": popup_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Popup not found")
    
    return {"message": "Popup deleted"}

# Public endpoints for frontend
@router.get("/public/banners", response_model=List[HeroBanner])
async def get_active_banners():
    """
    Get active hero banners. Public endpoint.
    """
    banners = await db.hero_banners.find(
        {"active": True},
        {"_id": 0}
    ).sort("order_position", 1).to_list(100)
    
    return banners

@router.get("/public/popup", response_model=Popup)
async def get_active_popup():
    """
    Get active popup. Public endpoint.
    Returns first active popup.
    """
    popup = await db.popups.find_one(
        {"active": True},
        {"_id": 0}
    )
    
    if not popup:
        raise HTTPException(status_code=404, detail="No active popup")
    
    return popup
