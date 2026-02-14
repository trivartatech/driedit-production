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
    """
    pincode_data = await db.pincodes.find_one(
        {"pincode": data.pincode},
        {"_id": 0}
    )
    
    if not pincode_data:
        raise HTTPException(status_code=404, detail="Delivery not available for this pincode")
    
    return {
        "available": True,
        "shipping_charge": pincode_data["shipping_charge"],
        "cod_available": pincode_data["cod_available"]
    }
