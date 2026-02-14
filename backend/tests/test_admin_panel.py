"""
Backend API tests for DRIEDIT Admin Panel
Testing: Admin login, Orders, Products, Categories, Pincodes, GST, Banners, Popups
"""
import pytest
import requests
import os
import uuid
import asyncio
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://driedit-checkout.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@driedit.in"
ADMIN_PASSWORD = "admin123"
REGULAR_USER_EMAIL = "test@example.com"
REGULAR_USER_PASSWORD = "password123"

# Global session tokens - set in setup
ADMIN_SESSION_TOKEN = None
USER_SESSION_TOKEN = None


def setup_module(module):
    """Create session tokens for admin and regular user via DB injection"""
    global ADMIN_SESSION_TOKEN, USER_SESSION_TOKEN
    
    from motor.motor_asyncio import AsyncIOMotorClient
    from dotenv import load_dotenv
    from pathlib import Path
    import bcrypt
    
    ROOT_DIR = Path(__file__).parent.parent
    load_dotenv(ROOT_DIR / '.env')
    
    async def setup_sessions():
        client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
        db = client[os.environ.get('DB_NAME', 'test_database')]
        
        admin_token = None
        user_token = None
        
        # Setup admin session
        admin = await db.users.find_one({"email": ADMIN_EMAIL})
        if admin:
            admin_token = f"pytest_admin_{uuid.uuid4().hex}"
            expires_at = datetime.now(timezone.utc) + timedelta(days=7)
            
            await db.user_sessions.delete_many({"user_id": admin["user_id"]})
            await db.user_sessions.insert_one({
                "user_id": admin["user_id"],
                "session_token": admin_token,
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc)
            })
            print(f"\nAdmin session created for {admin['email']} (role={admin.get('role')})")
            print(f"Token: {admin_token[:30]}...")
        else:
            print(f"\nWARNING: Admin user {ADMIN_EMAIL} not found!")
        
        # Setup regular user session
        user = await db.users.find_one({"email": REGULAR_USER_EMAIL})
        if user:
            user_token = f"pytest_user_{uuid.uuid4().hex}"
            expires_at = datetime.now(timezone.utc) + timedelta(days=7)
            
            await db.user_sessions.delete_many({"user_id": user["user_id"]})
            await db.user_sessions.insert_one({
                "user_id": user["user_id"],
                "session_token": user_token,
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc)
            })
            print(f"Regular user session created for {user['email']} (role={user.get('role')})")
        else:
            print(f"WARNING: Regular user {REGULAR_USER_EMAIL} not found!")
        
        client.close()
        return admin_token, user_token
    
    ADMIN_SESSION_TOKEN, USER_SESSION_TOKEN = asyncio.run(setup_sessions())
    
    # Verify the session works
    if ADMIN_SESSION_TOKEN:
        test_session = requests.Session()
        test_session.cookies.set("session_token", ADMIN_SESSION_TOKEN)
        resp = test_session.get(f"{BASE_URL}/api/auth/me")
        if resp.status_code == 200:
            print(f"Verified admin session works: {resp.json().get('email')}")
        else:
            print(f"WARNING: Admin session verification failed: {resp.status_code}")


def get_admin_session():
    """Get authenticated session with admin cookie"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    if ADMIN_SESSION_TOKEN:
        session.cookies.set("session_token", ADMIN_SESSION_TOKEN)
    return session


def get_user_session():
    """Get authenticated session with regular user cookie"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    if USER_SESSION_TOKEN:
        session.cookies.set("session_token", USER_SESSION_TOKEN)
    return session


def get_public_session():
    """Get session without auth"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestAdminAuthentication:
    """Test admin login and access control"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        session = get_public_session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful: role={data['user']['role']}")
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password"""
        session = get_public_session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Wrong password correctly rejected")
    
    def test_get_admin_user_info(self):
        """Test getting current admin user info"""
        session = get_admin_session()
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Get me failed: {response.text}"
        data = response.json()
        assert data["role"] == "admin"
        print(f"✓ Admin user info retrieved: {data['email']}")


class TestAdminAccessControl:
    """Test that non-admin users are denied access to admin routes"""
    
    def test_regular_user_denied_admin_pincodes(self):
        """Test regular user cannot access admin pincodes"""
        session = get_user_session()
        response = session.get(f"{BASE_URL}/api/admin/pincodes")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("✓ Regular user correctly denied access to admin pincodes")
    
    def test_regular_user_denied_admin_gst(self):
        """Test regular user cannot access admin GST"""
        session = get_user_session()
        response = session.get(f"{BASE_URL}/api/admin/gst")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Regular user correctly denied access to admin GST")
    
    def test_regular_user_denied_admin_banners(self):
        """Test regular user cannot access admin banners"""
        session = get_user_session()
        response = session.get(f"{BASE_URL}/api/admin/banners")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Regular user correctly denied access to admin banners")
    
    def test_unauthenticated_denied_admin_routes(self):
        """Test unauthenticated user cannot access admin routes"""
        session = get_public_session()
        response = session.get(f"{BASE_URL}/api/admin/pincodes")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Unauthenticated user correctly denied access")


class TestAdminOrders:
    """Test admin order management"""
    
    def test_get_all_orders(self):
        """Test admin can get all orders"""
        session = get_admin_session()
        response = session.get(f"{BASE_URL}/api/orders/admin/all")
        assert response.status_code == 200, f"Get orders failed: {response.text}"
        orders = response.json()
        assert isinstance(orders, list)
        print(f"✓ Retrieved {len(orders)} orders")
    
    def test_filter_orders_by_status(self):
        """Test filtering orders by status"""
        session = get_admin_session()
        response = session.get(f"{BASE_URL}/api/orders/admin/all", params={"status": "confirmed"})
        assert response.status_code == 200, f"Filter orders failed: {response.text}"
        orders = response.json()
        # All returned orders should be confirmed (if any exist)
        for order in orders:
            assert order["order_status"] == "confirmed", f"Order {order['order_id']} has wrong status"
        print(f"✓ Retrieved {len(orders)} confirmed orders")
    
    def test_update_order_status(self):
        """Test admin can update order status"""
        session = get_admin_session()
        
        # First get all orders
        orders_resp = session.get(f"{BASE_URL}/api/orders/admin/all")
        assert orders_resp.status_code == 200, f"Get orders failed: {orders_resp.text}"
        orders = orders_resp.json()
        
        if len(orders) == 0:
            pytest.skip("No orders to test status update")
        
        order = orders[0]
        original_status = order["order_status"]
        
        # Update to shipped (a valid next status)
        new_status = "shipped"
        
        update_resp = session.put(
            f"{BASE_URL}/api/orders/admin/{order['order_id']}/status",
            json={"order_status": new_status}
        )
        assert update_resp.status_code == 200, f"Update status failed: {update_resp.text}"
        
        # Revert the change
        session.put(
            f"{BASE_URL}/api/orders/admin/{order['order_id']}/status",
            json={"order_status": original_status}
        )
        print(f"✓ Order status updated from {original_status} to {new_status} and reverted")


class TestAdminProducts:
    """Test admin product management"""
    
    def test_get_all_products(self):
        """Test getting all products"""
        session = get_admin_session()
        response = session.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Get products failed: {response.text}"
        products = response.json()
        assert isinstance(products, list)
        assert len(products) > 0
        print(f"✓ Retrieved {len(products)} products")
    
    def test_create_product(self):
        """Test admin can create a product"""
        session = get_admin_session()
        
        # First get categories
        cat_resp = session.get(f"{BASE_URL}/api/categories")
        assert cat_resp.status_code == 200
        categories = cat_resp.json()
        
        if len(categories) == 0:
            pytest.skip("No categories available to create product")
        
        product_data = {
            "title": f"TEST_Product_{uuid.uuid4().hex[:8]}",
            "category_id": categories[0]["category_id"],
            "regular_price": 1999,
            "discounted_price": 1499,
            "sizes": ["M", "L", "XL"],
            "stock": 50,
            "images": ["https://example.com/test-product.jpg"],
            "description": "Test product created by automated tests"
        }
        
        response = session.post(f"{BASE_URL}/api/products", json=product_data)
        assert response.status_code in [200, 201], f"Create product failed: {response.text}"
        created = response.json()
        assert "product_id" in created
        assert created["title"] == product_data["title"]
        
        # Cleanup - delete the test product
        delete_resp = session.delete(f"{BASE_URL}/api/products/{created['product_id']}")
        assert delete_resp.status_code == 200, f"Delete product failed: {delete_resp.text}"
        print(f"✓ Product created and deleted: {created['product_id']}")
    
    def test_update_product(self):
        """Test admin can update a product"""
        session = get_admin_session()
        
        # Get products
        products_resp = session.get(f"{BASE_URL}/api/products")
        products = products_resp.json()
        
        if len(products) == 0:
            pytest.skip("No products to update")
        
        product = products[0]
        original_stock = product["stock"]
        new_stock = original_stock + 10
        
        # Update product stock
        update_resp = session.put(
            f"{BASE_URL}/api/products/{product['product_id']}",
            json={
                "title": product["title"],
                "category_id": product["category_id"],
                "regular_price": product["regular_price"],
                "discounted_price": product["discounted_price"],
                "sizes": product["sizes"],
                "stock": new_stock,
                "images": product["images"],
                "description": product.get("description", "")
            }
        )
        assert update_resp.status_code == 200, f"Update product failed: {update_resp.text}"
        
        # Revert the change
        session.put(
            f"{BASE_URL}/api/products/{product['product_id']}",
            json={
                "title": product["title"],
                "category_id": product["category_id"],
                "regular_price": product["regular_price"],
                "discounted_price": product["discounted_price"],
                "sizes": product["sizes"],
                "stock": original_stock,
                "images": product["images"],
                "description": product.get("description", "")
            }
        )
        print(f"✓ Product stock updated from {original_stock} to {new_stock} and reverted")


class TestAdminCategories:
    """Test admin category management"""
    
    def test_get_all_categories(self):
        """Test getting all categories"""
        session = get_admin_session()
        response = session.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200, f"Get categories failed: {response.text}"
        categories = response.json()
        assert isinstance(categories, list)
        print(f"✓ Retrieved {len(categories)} categories")
    
    def test_create_and_delete_category(self):
        """Test admin can create and delete a category"""
        session = get_admin_session()
        
        category_data = {
            "name": f"TEST_Category_{uuid.uuid4().hex[:8]}",
            "slug": f"test-category-{uuid.uuid4().hex[:8]}"
        }
        
        # Create category
        create_resp = session.post(f"{BASE_URL}/api/categories", json=category_data)
        assert create_resp.status_code in [200, 201], f"Create category failed: {create_resp.text}"
        created = create_resp.json()
        assert "category_id" in created
        
        # Verify by getting all categories
        get_resp = session.get(f"{BASE_URL}/api/categories")
        categories = get_resp.json()
        found = any(c["category_id"] == created["category_id"] for c in categories)
        assert found, "Created category not found in list"
        
        # Delete category
        delete_resp = session.delete(f"{BASE_URL}/api/categories/{created['category_id']}")
        assert delete_resp.status_code == 200, f"Delete category failed: {delete_resp.text}"
        
        print(f"✓ Category created and deleted: {created['category_id']}")


class TestAdminPincodes:
    """Test admin pincode management"""
    
    def test_get_all_pincodes(self):
        """Test admin can get all pincodes"""
        session = get_admin_session()
        response = session.get(f"{BASE_URL}/api/admin/pincodes")
        assert response.status_code == 200, f"Get pincodes failed: {response.text}"
        pincodes = response.json()
        assert isinstance(pincodes, list)
        print(f"✓ Retrieved {len(pincodes)} pincodes")
    
    def test_create_and_delete_pincode(self):
        """Test admin can create and delete a pincode"""
        session = get_admin_session()
        
        test_pincode = f"99{uuid.uuid4().hex[:4]}"[:6]  # Random 6 digit
        pincode_data = {
            "pincode": test_pincode,
            "shipping_charge": 99,
            "cod_available": True
        }
        
        # Create pincode
        create_resp = session.post(f"{BASE_URL}/api/admin/pincodes", json=pincode_data)
        assert create_resp.status_code in [200, 201], f"Create pincode failed: {create_resp.text}"
        
        # Verify by getting all pincodes
        get_resp = session.get(f"{BASE_URL}/api/admin/pincodes")
        pincodes = get_resp.json()
        found = any(p["pincode"] == test_pincode for p in pincodes)
        assert found, "Created pincode not found"
        
        # Delete pincode
        delete_resp = session.delete(f"{BASE_URL}/api/admin/pincodes/{test_pincode}")
        assert delete_resp.status_code == 200, f"Delete pincode failed: {delete_resp.text}"
        print(f"✓ Pincode {test_pincode} created and deleted")
    
    def test_update_pincode(self):
        """Test admin can update a pincode"""
        session = get_admin_session()
        
        # Get existing pincodes
        pincodes_resp = session.get(f"{BASE_URL}/api/admin/pincodes")
        assert pincodes_resp.status_code == 200
        pincodes = pincodes_resp.json()
        
        if len(pincodes) == 0:
            pytest.skip("No pincodes to update")
        
        pincode = pincodes[0]
        original_charge = pincode["shipping_charge"]
        new_charge = original_charge + 10
        
        # Update pincode
        update_resp = session.put(
            f"{BASE_URL}/api/admin/pincodes/{pincode['pincode']}",
            json={
                "pincode": pincode["pincode"],
                "shipping_charge": new_charge,
                "cod_available": pincode["cod_available"]
            }
        )
        assert update_resp.status_code == 200, f"Update pincode failed: {update_resp.text}"
        
        # Revert
        session.put(
            f"{BASE_URL}/api/admin/pincodes/{pincode['pincode']}",
            json={
                "pincode": pincode["pincode"],
                "shipping_charge": original_charge,
                "cod_available": pincode["cod_available"]
            }
        )
        print(f"✓ Pincode {pincode['pincode']} shipping charge updated and reverted")


class TestAdminGST:
    """Test admin GST settings"""
    
    def test_get_gst_settings(self):
        """Test admin can get GST settings"""
        session = get_admin_session()
        response = session.get(f"{BASE_URL}/api/admin/gst")
        assert response.status_code == 200, f"Get GST failed: {response.text}"
        gst = response.json()
        assert "gst_percentage" in gst
        assert gst["gst_percentage"] >= 0
        print(f"✓ GST percentage: {gst['gst_percentage']}%")
    
    def test_update_gst_settings(self):
        """Test admin can update GST settings"""
        session = get_admin_session()
        
        # Get current GST
        get_resp = session.get(f"{BASE_URL}/api/admin/gst")
        assert get_resp.status_code == 200, f"Get GST failed: {get_resp.text}"
        original_gst = get_resp.json()["gst_percentage"]
        
        # Update GST (note: API uses query param not body)
        new_gst = 20.0 if original_gst != 20.0 else 18.0
        update_resp = session.put(
            f"{BASE_URL}/api/admin/gst",
            params={"gst_percentage": new_gst}
        )
        assert update_resp.status_code == 200, f"Update GST failed: {update_resp.text}"
        
        # Verify update
        verify_resp = session.get(f"{BASE_URL}/api/admin/gst")
        updated_gst = verify_resp.json()["gst_percentage"]
        assert updated_gst == new_gst, f"GST not updated: expected {new_gst}, got {updated_gst}"
        
        # Revert
        session.put(f"{BASE_URL}/api/admin/gst", params={"gst_percentage": original_gst})
        print(f"✓ GST updated from {original_gst}% to {new_gst}% and reverted")


class TestAdminBanners:
    """Test admin banner management"""
    
    def test_get_all_banners(self):
        """Test admin can get all banners"""
        session = get_admin_session()
        response = session.get(f"{BASE_URL}/api/admin/banners")
        assert response.status_code == 200, f"Get banners failed: {response.text}"
        banners = response.json()
        assert isinstance(banners, list)
        print(f"✓ Retrieved {len(banners)} banners")
    
    def test_create_and_delete_banner(self):
        """Test admin can create and delete a banner"""
        session = get_admin_session()
        
        banner_data = {
            "image": "https://example.com/test-banner.jpg",
            "button_text": "TEST BANNER",
            "redirect_url": "/test-page",
            "active": False,  # Keep inactive to not affect frontend
            "order_position": 99
        }
        
        # Create banner
        create_resp = session.post(f"{BASE_URL}/api/admin/banners", json=banner_data)
        assert create_resp.status_code in [200, 201], f"Create banner failed: {create_resp.text}"
        created = create_resp.json()
        assert "banner_id" in created
        
        # Verify by getting all banners
        get_resp = session.get(f"{BASE_URL}/api/admin/banners")
        banners = get_resp.json()
        found = any(b["banner_id"] == created["banner_id"] for b in banners)
        assert found, "Created banner not found"
        
        # Delete banner
        delete_resp = session.delete(f"{BASE_URL}/api/admin/banners/{created['banner_id']}")
        assert delete_resp.status_code == 200, f"Delete banner failed: {delete_resp.text}"
        
        print(f"✓ Banner created and deleted: {created['banner_id']}")


class TestAdminPopups:
    """Test admin popup management"""
    
    def test_get_all_popups(self):
        """Test admin can get all popups"""
        session = get_admin_session()
        response = session.get(f"{BASE_URL}/api/admin/popups")
        assert response.status_code == 200, f"Get popups failed: {response.text}"
        popups = response.json()
        assert isinstance(popups, list)
        print(f"✓ Retrieved {len(popups)} popups")
    
    def test_create_and_delete_popup(self):
        """Test admin can create and delete a popup"""
        session = get_admin_session()
        
        popup_data = {
            "title": "TEST POPUP",
            "description": "This is a test popup",
            "image": "https://example.com/test-popup.jpg",
            "button_text": "TEST ACTION",
            "redirect_url": "/test-page",
            "active": False,
            "display_type": "once"
        }
        
        # Create popup
        create_resp = session.post(f"{BASE_URL}/api/admin/popups", json=popup_data)
        assert create_resp.status_code in [200, 201], f"Create popup failed: {create_resp.text}"
        created = create_resp.json()
        assert "popup_id" in created
        
        # Verify by getting all popups
        get_resp = session.get(f"{BASE_URL}/api/admin/popups")
        popups = get_resp.json()
        found = any(p["popup_id"] == created["popup_id"] for p in popups)
        assert found, "Created popup not found"
        
        # Delete popup
        delete_resp = session.delete(f"{BASE_URL}/api/admin/popups/{created['popup_id']}")
        assert delete_resp.status_code == 200, f"Delete popup failed: {delete_resp.text}"
        
        print(f"✓ Popup created and deleted: {created['popup_id']}")


class TestAdminReturns:
    """Test admin returns management"""
    
    def test_get_all_returns(self):
        """Test admin can get all return requests"""
        session = get_admin_session()
        response = session.get(f"{BASE_URL}/api/returns/admin/all")
        assert response.status_code == 200, f"Get returns failed: {response.text}"
        returns = response.json()
        assert isinstance(returns, list)
        print(f"✓ Retrieved {len(returns)} return requests")


class TestPublicEndpoints:
    """Test public endpoints that should work without admin auth"""
    
    def test_public_banners(self):
        """Test public can get active banners"""
        session = get_public_session()
        response = session.get(f"{BASE_URL}/api/admin/public/banners")
        assert response.status_code == 200, f"Get public banners failed: {response.text}"
        banners = response.json()
        assert isinstance(banners, list)
        print(f"✓ Public retrieved {len(banners)} active banners")
    
    def test_public_gst(self):
        """Test public can get GST settings"""
        session = get_public_session()
        response = session.get(f"{BASE_URL}/api/admin/public/gst")
        assert response.status_code == 200, f"Get public GST failed: {response.text}"
        gst = response.json()
        assert "gst_percentage" in gst
        print(f"✓ Public GST endpoint working: {gst['gst_percentage']}%")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
