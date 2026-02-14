from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import FileResponse
from auth import require_admin
from typing import List
import uuid
import os
import shutil
from pathlib import Path
import logging
import mimetypes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

# Configuration
BASE_UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR = BASE_UPLOAD_DIR / "products"
BANNER_DIR = BASE_UPLOAD_DIR / "banners"
POPUP_DIR = BASE_UPLOAD_DIR / "popups"
SIZE_CHART_DIR = BASE_UPLOAD_DIR / "size-charts"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALL_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
PDF_EXTENSIONS = {".pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Ensure all upload directories exist
for dir_path in [UPLOAD_DIR, BANNER_DIR, POPUP_DIR, SIZE_CHART_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)


def validate_file_security(filename: str, content: bytes, allowed_extensions: set, max_size: int = MAX_FILE_SIZE):
    """Comprehensive file validation for security"""
    # Check file size
    if len(content) > max_size:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size: {max_size // (1024*1024)}MB"
        )
    
    # Sanitize and validate extension
    ext = Path(filename).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Validate MIME type matches extension
    mime_type, _ = mimetypes.guess_type(filename)
    
    if ext in IMAGE_EXTENSIONS or ext in ALL_IMAGE_EXTENSIONS:
        if not mime_type or not mime_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid image file")
        # Check magic bytes for images
        if not (content[:3] == b'\xff\xd8\xff' or  # JPEG
                content[:8] == b'\x89PNG\r\n\x1a\n' or  # PNG
                content[:4] == b'RIFF' or  # WebP
                content[:6] in (b'GIF87a', b'GIF89a')):  # GIF
            raise HTTPException(status_code=400, detail="Invalid image content")
    
    elif ext in PDF_EXTENSIONS:
        if not mime_type or mime_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Invalid PDF file")
        # Check PDF magic bytes
        if not content[:5] == b'%PDF-':
            raise HTTPException(status_code=400, detail="Invalid PDF content")
    
    # Prevent path traversal
    safe_filename = Path(filename).name
    if '..' in safe_filename or '/' in safe_filename or '\\' in safe_filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    return ext


def generate_unique_filename(ext: str) -> str:
    """Generate UUID-based unique filename"""
    return f"{uuid.uuid4().hex}{ext}"


async def save_uploaded_file(content: bytes, directory: Path, ext: str) -> tuple:
    """Save file and return filename and URL"""
    unique_filename = generate_unique_filename(ext)
    file_path = directory / unique_filename
    
    try:
        with open(file_path, "wb") as f:
            f.write(content)
        return unique_filename, file_path
    except Exception as e:
        logger.error(f"Error saving file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save file")


# ==================
# PRODUCT IMAGES
# ==================

@router.post("/product-image")
async def upload_product_image(
    request: Request,
    file: UploadFile = File(...)
):
    """Upload a single product image (Admin only)."""
    await require_admin(request)
    
    content = await file.read()
    ext = validate_file_security(file.filename, content, ALL_IMAGE_EXTENSIONS)
    
    unique_filename, _ = await save_uploaded_file(content, UPLOAD_DIR, ext)
    image_url = f"/api/uploads/images/{unique_filename}"
    
    logger.info(f"Uploaded product image: {unique_filename}")
    
    return {
        "success": True,
        "filename": unique_filename,
        "url": image_url,
        "size": len(content)
    }


@router.post("/product-images")
async def upload_multiple_product_images(
    request: Request,
    files: List[UploadFile] = File(...)
):
    """Upload multiple product images (Admin only)."""
    await require_admin(request)
    
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 images allowed per upload")
    
    uploaded = []
    errors = []
    
    for file in files:
        try:
            content = await file.read()
            ext = validate_file_security(file.filename, content, ALL_IMAGE_EXTENSIONS)
            unique_filename, _ = await save_uploaded_file(content, UPLOAD_DIR, ext)
            
            image_url = f"/api/uploads/images/{unique_filename}"
            uploaded.append({
                "filename": unique_filename,
                "url": image_url,
                "original_name": file.filename
            })
            
        except HTTPException as e:
            errors.append(f"{file.filename}: {e.detail}")
        except Exception:
            errors.append(f"{file.filename}: Upload failed")
    
    return {
        "success": len(uploaded) > 0,
        "uploaded": uploaded,
        "errors": errors if errors else None,
        "count": len(uploaded)
    }


@router.get("/images/{filename}")
async def get_product_image(filename: str):
    """Serve uploaded product image."""
    safe_filename = Path(filename).name
    file_path = UPLOAD_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
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
        headers={"Cache-Control": "public, max-age=31536000"}
    )


@router.delete("/images/{filename}")
async def delete_product_image(filename: str, request: Request):
    """Delete an uploaded product image (Admin only)."""
    await require_admin(request)
    
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


# ==================
# BANNER IMAGES
# ==================

@router.post("/banner-image")
async def upload_banner_image(
    request: Request,
    file: UploadFile = File(...)
):
    """Upload a banner image (Admin only)."""
    await require_admin(request)
    
    content = await file.read()
    ext = validate_file_security(file.filename, content, IMAGE_EXTENSIONS)
    
    unique_filename, _ = await save_uploaded_file(content, BANNER_DIR, ext)
    image_url = f"/api/uploads/banners/{unique_filename}"
    
    logger.info(f"Uploaded banner image: {unique_filename}")
    
    return {
        "success": True,
        "filename": unique_filename,
        "url": image_url,
        "size": len(content)
    }


@router.get("/banners/{filename}")
async def get_banner_image(filename: str):
    """Serve uploaded banner image."""
    safe_filename = Path(filename).name
    file_path = BANNER_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Banner image not found")
    
    ext = file_path.suffix.lower()
    content_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp"
    }
    content_type = content_types.get(ext, "application/octet-stream")
    
    return FileResponse(
        file_path,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=31536000"}
    )


@router.delete("/banner-image/{filename}")
async def delete_banner_image(filename: str, request: Request):
    """Delete a banner image (Admin only)."""
    await require_admin(request)
    
    safe_filename = Path(filename).name
    file_path = BANNER_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Banner image not found")
    
    try:
        os.remove(file_path)
        logger.info(f"Deleted banner image: {safe_filename}")
        return {"success": True, "message": "Banner image deleted"}
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete banner image")


# ==================
# POPUP IMAGES
# ==================

@router.post("/popup-image")
async def upload_popup_image(
    request: Request,
    file: UploadFile = File(...)
):
    """Upload a popup image (Admin only)."""
    await require_admin(request)
    
    content = await file.read()
    ext = validate_file_security(file.filename, content, IMAGE_EXTENSIONS)
    
    unique_filename, _ = await save_uploaded_file(content, POPUP_DIR, ext)
    image_url = f"/api/uploads/popups/{unique_filename}"
    
    logger.info(f"Uploaded popup image: {unique_filename}")
    
    return {
        "success": True,
        "filename": unique_filename,
        "url": image_url,
        "size": len(content)
    }


@router.get("/popups/{filename}")
async def get_popup_image(filename: str):
    """Serve uploaded popup image."""
    safe_filename = Path(filename).name
    file_path = POPUP_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Popup image not found")
    
    ext = file_path.suffix.lower()
    content_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp"
    }
    content_type = content_types.get(ext, "application/octet-stream")
    
    return FileResponse(
        file_path,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=31536000"}
    )


@router.delete("/popup-image/{filename}")
async def delete_popup_image(filename: str, request: Request):
    """Delete a popup image (Admin only)."""
    await require_admin(request)
    
    safe_filename = Path(filename).name
    file_path = POPUP_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Popup image not found")
    
    try:
        os.remove(file_path)
        logger.info(f"Deleted popup image: {safe_filename}")
        return {"success": True, "message": "Popup image deleted"}
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete popup image")


# ==================
# SIZE CHART PDFs
# ==================

@router.post("/size-chart")
async def upload_size_chart(
    request: Request,
    file: UploadFile = File(...)
):
    """Upload a size chart PDF (Admin only)."""
    await require_admin(request)
    
    content = await file.read()
    ext = validate_file_security(file.filename, content, PDF_EXTENSIONS)
    
    unique_filename, _ = await save_uploaded_file(content, SIZE_CHART_DIR, ext)
    pdf_url = f"/api/uploads/size-charts/{unique_filename}"
    
    logger.info(f"Uploaded size chart: {unique_filename}")
    
    return {
        "success": True,
        "filename": unique_filename,
        "url": pdf_url,
        "size": len(content)
    }


@router.get("/size-charts/{filename}")
async def get_size_chart(filename: str):
    """Serve uploaded size chart PDF."""
    safe_filename = Path(filename).name
    file_path = SIZE_CHART_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Size chart not found")
    
    return FileResponse(
        file_path,
        media_type="application/pdf",
        headers={
            "Cache-Control": "public, max-age=31536000",
            "Content-Disposition": f"inline; filename={safe_filename}"
        }
    )


@router.delete("/size-chart/{filename}")
async def delete_size_chart(filename: str, request: Request):
    """Delete a size chart PDF (Admin only)."""
    await require_admin(request)
    
    safe_filename = Path(filename).name
    file_path = SIZE_CHART_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Size chart not found")
    
    try:
        os.remove(file_path)
        logger.info(f"Deleted size chart: {safe_filename}")
        return {"success": True, "message": "Size chart deleted"}
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete size chart")

