from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import FileResponse
from auth import require_admin
from typing import List
import uuid
import os
import shutil
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

# Configuration
UPLOAD_DIR = Path(__file__).parent.parent / "uploads" / "products"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Ensure upload directory exists
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def validate_image(file: UploadFile) -> None:
    """Validate uploaded image file."""
    # Check extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check content type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

@router.post("/product-image")
async def upload_product_image(
    request: Request,
    file: UploadFile = File(...)
):
    """
    Upload a single product image (Admin only).
    Returns the URL path to access the uploaded image.
    """
    await require_admin(request)
    
    # Validate file
    validate_image(file)
    
    # Read file content to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Generate unique filename
    ext = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    try:
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)
        
        logger.info(f"Uploaded product image: {unique_filename}")
        
        # Return the URL path (relative to API)
        image_url = f"/api/uploads/images/{unique_filename}"
        
        return {
            "success": True,
            "filename": unique_filename,
            "url": image_url,
            "size": len(content)
        }
        
    except Exception as e:
        logger.error(f"Error saving uploaded file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save image")

@router.post("/product-images")
async def upload_multiple_product_images(
    request: Request,
    files: List[UploadFile] = File(...)
):
    """
    Upload multiple product images (Admin only).
    Returns list of URL paths for uploaded images.
    """
    await require_admin(request)
    
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 images allowed per upload")
    
    uploaded = []
    errors = []
    
    for file in files:
        try:
            # Validate file
            validate_image(file)
            
            # Read content
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                errors.append(f"{file.filename}: File too large")
                continue
            
            # Generate unique filename
            ext = Path(file.filename).suffix.lower()
            unique_filename = f"{uuid.uuid4().hex}{ext}"
            file_path = UPLOAD_DIR / unique_filename
            
            # Save file
            with open(file_path, "wb") as f:
                f.write(content)
            
            image_url = f"/api/uploads/images/{unique_filename}"
            uploaded.append({
                "filename": unique_filename,
                "url": image_url,
                "original_name": file.filename
            })
            
        except HTTPException as e:
            errors.append(f"{file.filename}: {e.detail}")
        except Exception as e:
            errors.append(f"{file.filename}: Upload failed")
    
    return {
        "success": len(uploaded) > 0,
        "uploaded": uploaded,
        "errors": errors if errors else None,
        "count": len(uploaded)
    }

@router.get("/images/{filename}")
async def get_product_image(filename: str):
    """
    Serve uploaded product image.
    """
    # Sanitize filename to prevent directory traversal
    safe_filename = Path(filename).name
    file_path = UPLOAD_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Determine content type
    ext = file_path.suffix.lower()
    content_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif"
    }
    content_type = content_types.get(ext, "application/octet-stream")
    
    return FileResponse(
        file_path,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=31536000"}  # Cache for 1 year
    )

@router.delete("/images/{filename}")
async def delete_product_image(filename: str, request: Request):
    """
    Delete an uploaded product image (Admin only).
    """
    await require_admin(request)
    
    # Sanitize filename
    safe_filename = Path(filename).name
    file_path = UPLOAD_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        os.remove(file_path)
        logger.info(f"Deleted product image: {safe_filename}")
        return {"success": True, "message": "Image deleted"}
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete image")
