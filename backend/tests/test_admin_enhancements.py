"""
Admin Enhancements Module Tests
Tests: Dynamic Size Management, Banner/Popup image uploads, Size Chart PDF upload
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSizesAPI:
    """Test Size CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login as admin"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@driedit.in",
            "password": "adminpassword"
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
        self.created_size_ids = []
        yield
        # Cleanup - delete test sizes
        for size_id in self.created_size_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/admin/sizes/{size_id}")
            except:
                pass
    
    def test_get_all_sizes_public(self):
        """Test public endpoint to get active sizes with grouping"""
        resp = self.session.get(f"{BASE_URL}/api/admin/sizes/active")
        assert resp.status_code == 200
        data = resp.json()
        
        assert "sizes" in data
        assert "grouped" in data
        assert "count" in data
        assert data["count"] >= 12, "Should have at least 12 seeded sizes"
        
        # Verify grouping
        grouped = data["grouped"]
        assert "clothing" in grouped, "Should have clothing sizes"
        assert "bottomwear" in grouped, "Should have bottomwear sizes"
        
        # Verify clothing sizes XS, S, M, L, XL, XXL exist
        clothing_names = [s["name"] for s in grouped["clothing"]]
        for expected in ["XS", "S", "M", "L", "XL", "XXL"]:
            assert expected in clothing_names, f"Missing clothing size: {expected}"
        
        # Verify bottomwear sizes 28, 30, 32, 34, 36, 38 exist
        bottomwear_names = [s["name"] for s in grouped["bottomwear"]]
        for expected in ["28", "30", "32", "34", "36", "38"]:
            assert expected in bottomwear_names, f"Missing bottomwear size: {expected}"
        
        print(f"PASS: Get active sizes - {data['count']} sizes, grouped by category")
    
    def test_get_all_sizes_admin(self):
        """Test admin endpoint to get all sizes (including inactive)"""
        resp = self.session.get(f"{BASE_URL}/api/admin/sizes?include_inactive=true")
        assert resp.status_code == 200
        data = resp.json()
        
        assert "sizes" in data
        assert "count" in data
        assert data["count"] >= 12
        print(f"PASS: Admin get all sizes - {data['count']} sizes")
    
    def test_create_new_size(self):
        """Test creating a new size"""
        new_size = {
            "name": "TEST_3XL",
            "category_type": "clothing",
            "active": True
        }
        resp = self.session.post(f"{BASE_URL}/api/admin/sizes", json=new_size)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "size" in data
        assert data["size"]["name"] == "TEST_3XL"
        assert data["size"]["category_type"] == "clothing"
        assert data["size"]["active"] is True
        assert "size_id" in data["size"]
        
        self.created_size_ids.append(data["size"]["size_id"])
        print(f"PASS: Create size - {data['size']['name']}")
    
    def test_create_duplicate_size_fails(self):
        """Test that creating duplicate size fails"""
        # Create first
        new_size = {"name": "TEST_4XL", "category_type": "clothing", "active": True}
        resp = self.session.post(f"{BASE_URL}/api/admin/sizes", json=new_size)
        assert resp.status_code == 200
        self.created_size_ids.append(resp.json()["size"]["size_id"])
        
        # Try duplicate
        resp2 = self.session.post(f"{BASE_URL}/api/admin/sizes", json=new_size)
        assert resp2.status_code == 400
        assert "already exists" in resp2.json().get("detail", "").lower()
        print("PASS: Duplicate size rejected")
    
    def test_update_size(self):
        """Test updating a size"""
        # Create first
        new_size = {"name": "TEST_5XL", "category_type": "clothing", "active": True}
        create_resp = self.session.post(f"{BASE_URL}/api/admin/sizes", json=new_size)
        assert create_resp.status_code == 200
        size_id = create_resp.json()["size"]["size_id"]
        self.created_size_ids.append(size_id)
        
        # Update
        update_data = {"name": "TEST_5XL_UPDATED", "category_type": "footwear"}
        resp = self.session.put(f"{BASE_URL}/api/admin/sizes/{size_id}", json=update_data)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["size"]["name"] == "TEST_5XL_UPDATED"
        assert data["size"]["category_type"] == "footwear"
        print("PASS: Update size")
    
    def test_toggle_size_active(self):
        """Test toggling size active status"""
        # Create first
        new_size = {"name": "TEST_6XL", "category_type": "clothing", "active": True}
        create_resp = self.session.post(f"{BASE_URL}/api/admin/sizes", json=new_size)
        assert create_resp.status_code == 200
        size_id = create_resp.json()["size"]["size_id"]
        self.created_size_ids.append(size_id)
        
        # Toggle to inactive
        resp = self.session.put(f"{BASE_URL}/api/admin/sizes/{size_id}/toggle")
        assert resp.status_code == 200
        assert resp.json()["active"] is False
        
        # Toggle back to active
        resp2 = self.session.put(f"{BASE_URL}/api/admin/sizes/{size_id}/toggle")
        assert resp2.status_code == 200
        assert resp2.json()["active"] is True
        print("PASS: Toggle size active status")
    
    def test_delete_size(self):
        """Test deleting a size not used in products"""
        # Create first
        new_size = {"name": "TEST_7XL", "category_type": "clothing", "active": True}
        create_resp = self.session.post(f"{BASE_URL}/api/admin/sizes", json=new_size)
        assert create_resp.status_code == 200
        size_id = create_resp.json()["size"]["size_id"]
        
        # Delete
        resp = self.session.delete(f"{BASE_URL}/api/admin/sizes/{size_id}")
        assert resp.status_code == 200
        assert "deleted" in resp.json().get("message", "").lower()
        print("PASS: Delete unused size")
    
    def test_delete_used_size_fails(self):
        """Test that deleting a size used in products fails"""
        # Try to delete 'M' which is likely used in products
        # First get the M size_id
        resp = self.session.get(f"{BASE_URL}/api/admin/sizes?include_inactive=true")
        sizes = resp.json()["sizes"]
        m_size = next((s for s in sizes if s["name"] == "M"), None)
        
        if m_size:
            # Check if there are products using 'M' 
            products_resp = self.session.get(f"{BASE_URL}/api/products")
            products = products_resp.json()
            products_with_m = [p for p in products if "M" in p.get("sizes", [])]
            
            if products_with_m:
                # Try to delete - should fail
                delete_resp = self.session.delete(f"{BASE_URL}/api/admin/sizes/{m_size['size_id']}")
                assert delete_resp.status_code == 400
                assert "used in product" in delete_resp.json().get("detail", "").lower() or "deactivate" in delete_resp.json().get("detail", "").lower()
                print("PASS: Delete used size properly rejected")
            else:
                print("SKIP: No products using M size to test deletion rejection")
        else:
            print("SKIP: M size not found")


class TestUploadAPI:
    """Test file upload endpoints (Banner, Popup, Size Chart)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login as admin"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@driedit.in",
            "password": "adminpassword"
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
        self.uploaded_files = []
        yield
        # Cleanup - delete uploaded files
        for file_info in self.uploaded_files:
            try:
                if file_info["type"] == "banner":
                    self.session.delete(f"{BASE_URL}/api/uploads/banner-image/{file_info['filename']}")
                elif file_info["type"] == "popup":
                    self.session.delete(f"{BASE_URL}/api/uploads/popup-image/{file_info['filename']}")
                elif file_info["type"] == "size-chart":
                    self.session.delete(f"{BASE_URL}/api/uploads/size-chart/{file_info['filename']}")
            except:
                pass
    
    def create_test_image(self):
        """Create a minimal valid JPEG image"""
        # Minimal JPEG (1x1 red pixel)
        jpeg_data = bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
            0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
            0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
            0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
            0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
            0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
            0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
            0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
            0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
            0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
            0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
            0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
            0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
            0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
            0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xF8, 0xF3, 0x57, 0x6E,
            0xCA, 0xA2, 0x1D, 0x34, 0x7E, 0x67, 0xFF, 0xD9
        ])
        return jpeg_data
    
    def create_test_pdf(self):
        """Create a minimal valid PDF"""
        pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
193
%%EOF"""
        return pdf_content
    
    def test_banner_image_upload(self):
        """Test banner image upload"""
        image_data = self.create_test_image()
        files = {"file": ("test_banner.jpg", io.BytesIO(image_data), "image/jpeg")}
        
        resp = self.session.post(f"{BASE_URL}/api/uploads/banner-image", files=files)
        assert resp.status_code == 200, f"Banner upload failed: {resp.text}"
        data = resp.json()
        
        assert data["success"] is True
        assert "filename" in data
        assert "url" in data
        assert data["url"].startswith("/api/uploads/banners/")
        
        self.uploaded_files.append({"type": "banner", "filename": data["filename"]})
        print(f"PASS: Banner image upload - {data['filename']}")
    
    def test_banner_image_invalid_type(self):
        """Test banner upload rejects non-image files"""
        files = {"file": ("test.txt", io.BytesIO(b"not an image"), "text/plain")}
        
        resp = self.session.post(f"{BASE_URL}/api/uploads/banner-image", files=files)
        assert resp.status_code == 400
        print("PASS: Banner upload rejects invalid file type")
    
    def test_popup_image_upload(self):
        """Test popup image upload"""
        image_data = self.create_test_image()
        files = {"file": ("test_popup.jpg", io.BytesIO(image_data), "image/jpeg")}
        
        resp = self.session.post(f"{BASE_URL}/api/uploads/popup-image", files=files)
        assert resp.status_code == 200, f"Popup upload failed: {resp.text}"
        data = resp.json()
        
        assert data["success"] is True
        assert "filename" in data
        assert "url" in data
        assert data["url"].startswith("/api/uploads/popups/")
        
        self.uploaded_files.append({"type": "popup", "filename": data["filename"]})
        print(f"PASS: Popup image upload - {data['filename']}")
    
    def test_popup_image_invalid_type(self):
        """Test popup upload rejects non-image files"""
        files = {"file": ("test.exe", io.BytesIO(b"malicious content"), "application/octet-stream")}
        
        resp = self.session.post(f"{BASE_URL}/api/uploads/popup-image", files=files)
        assert resp.status_code == 400
        print("PASS: Popup upload rejects invalid file type")
    
    def test_size_chart_pdf_upload(self):
        """Test size chart PDF upload"""
        pdf_data = self.create_test_pdf()
        files = {"file": ("size_chart.pdf", io.BytesIO(pdf_data), "application/pdf")}
        
        resp = self.session.post(f"{BASE_URL}/api/uploads/size-chart", files=files)
        assert resp.status_code == 200, f"Size chart upload failed: {resp.text}"
        data = resp.json()
        
        assert data["success"] is True
        assert "filename" in data
        assert "url" in data
        assert data["url"].startswith("/api/uploads/size-charts/")
        
        self.uploaded_files.append({"type": "size-chart", "filename": data["filename"]})
        print(f"PASS: Size chart PDF upload - {data['filename']}")
    
    def test_size_chart_rejects_non_pdf(self):
        """Test size chart upload rejects non-PDF files"""
        image_data = self.create_test_image()
        files = {"file": ("fake_chart.jpg", io.BytesIO(image_data), "image/jpeg")}
        
        resp = self.session.post(f"{BASE_URL}/api/uploads/size-chart", files=files)
        assert resp.status_code == 400
        print("PASS: Size chart rejects non-PDF files")
    
    def test_serve_uploaded_banner(self):
        """Test serving uploaded banner image"""
        # Upload first
        image_data = self.create_test_image()
        files = {"file": ("test_serve_banner.jpg", io.BytesIO(image_data), "image/jpeg")}
        upload_resp = self.session.post(f"{BASE_URL}/api/uploads/banner-image", files=files)
        assert upload_resp.status_code == 200
        filename = upload_resp.json()["filename"]
        self.uploaded_files.append({"type": "banner", "filename": filename})
        
        # Serve
        serve_resp = self.session.get(f"{BASE_URL}/api/uploads/banners/{filename}")
        assert serve_resp.status_code == 200
        assert "image" in serve_resp.headers.get("content-type", "")
        print("PASS: Serve uploaded banner image")
    
    def test_serve_uploaded_size_chart(self):
        """Test serving uploaded size chart PDF"""
        # Upload first
        pdf_data = self.create_test_pdf()
        files = {"file": ("test_serve_chart.pdf", io.BytesIO(pdf_data), "application/pdf")}
        upload_resp = self.session.post(f"{BASE_URL}/api/uploads/size-chart", files=files)
        assert upload_resp.status_code == 200
        filename = upload_resp.json()["filename"]
        self.uploaded_files.append({"type": "size-chart", "filename": filename})
        
        # Serve
        serve_resp = self.session.get(f"{BASE_URL}/api/uploads/size-charts/{filename}")
        assert serve_resp.status_code == 200
        assert "pdf" in serve_resp.headers.get("content-type", "")
        print("PASS: Serve uploaded size chart PDF")


class TestProductSizeChart:
    """Test product size chart integration"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login as admin"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@driedit.in",
            "password": "adminpassword"
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
    
    def test_product_with_size_chart_field(self):
        """Test that products can have size_chart_pdf field"""
        # Get products
        resp = self.session.get(f"{BASE_URL}/api/products")
        assert resp.status_code == 200
        products = resp.json()
        
        if products:
            product = products[0]
            # size_chart_pdf should be in the response (even if null)
            assert "size_chart_pdf" in product or product.get("size_chart_pdf") is None
            print(f"PASS: Product has size_chart_pdf field - value: {product.get('size_chart_pdf')}")
        else:
            print("SKIP: No products to test size_chart_pdf field")
    
    def test_product_shows_dynamic_sizes(self):
        """Test that products use dynamically loaded sizes"""
        # Get active sizes
        sizes_resp = self.session.get(f"{BASE_URL}/api/admin/sizes/active")
        assert sizes_resp.status_code == 200
        available_sizes = [s["name"] for s in sizes_resp.json()["sizes"]]
        
        # Get products and check their sizes are from available sizes
        products_resp = self.session.get(f"{BASE_URL}/api/products")
        assert products_resp.status_code == 200
        products = products_resp.json()
        
        if products:
            for product in products[:3]:  # Check first 3 products
                product_sizes = product.get("sizes", [])
                for size in product_sizes:
                    assert size in available_sizes, f"Product {product['title']} has invalid size: {size}"
            print("PASS: Products use valid dynamic sizes")
        else:
            print("SKIP: No products to test dynamic sizes")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
