from fastapi import APIRouter, HTTPException
from auth import db
from pydantic import BaseModel

router = APIRouter(prefix="/api/public", tags=["public"])

class PincodeCheck(BaseModel):
    pincode: str

@router.post("/check-pincode")
async def check_pincode(data: PincodeCheck):
    """
    Check if delivery is available for a pincode.
    Public endpoint - no auth required.
    
    Default behavior: ALL pincodes are serviceable with FREE shipping and COD available.
    Database entries act as OVERRIDES only (to charge shipping or disable COD).
    """
    # Check if pincode has a custom override in DB
    pincode_data = await db.pincodes.find_one(
        {"pincode": data.pincode},
        {"_id": 0}
    )
    
    if pincode_data:
        # Override exists - use custom values
        return {
            "available": True,
            "shipping_charge": pincode_data.get("shipping_charge", 0),
            "cod_available": pincode_data.get("cod_available", True),
            "is_override": True
        }
    
    # No override - use defaults (all serviceable, free shipping, COD available)
    return {
        "available": True,
        "shipping_charge": 0,
        "cod_available": True,
        "is_override": False
    }
