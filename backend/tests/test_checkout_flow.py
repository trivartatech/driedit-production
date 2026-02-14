"""
Backend API tests for DRIEDIT Checkout Flow
Testing: Auth, Cart, Orders, Pincode validation, GST
"""
import pytest
import requests
import os

# Get API URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://driedit-checkout.preview.emergentagent.com').rstrip('/')

# Session to maintain cookies across requests
session = requests.Session()
session.headers.update({"Content-Type": "application/json"})

# Test credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "password123"


class TestHealthAndPublicEndpoints:
    """Test health and public endpoints - no auth required"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ API health check passed")
    
    def test_get_products(self):
        """Test get products endpoint"""
        response = session.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Get products failed: {response.text}"
        products = response.json()
        assert isinstance(products, list)
        assert len(products) > 0, "No products found"
        print(f"✓ Found {len(products)} products")
        
    def test_pincode_validation_success(self):
        """Test pincode 110001 which should be valid"""
        response = session.post(
            f"{BASE_URL}/api/public/check-pincode",
            json={"pincode": "110001"}
        )
        assert response.status_code == 200, f"Pincode check failed: {response.text}"
        data = response.json()
        assert data.get("available") == True
        assert "shipping_charge" in data
        assert "cod_available" in data
        print(f"✓ Pincode 110001 is valid: shipping={data['shipping_charge']}, COD={data['cod_available']}")
    
    def test_pincode_validation_failure(self):
        """Test invalid pincode"""
        response = session.post(
            f"{BASE_URL}/api/public/check-pincode",
            json={"pincode": "999999"}
        )
        assert response.status_code == 404, f"Expected 404 for invalid pincode, got {response.status_code}"
        print("✓ Invalid pincode correctly rejected")


class TestAuthentication:
    """Test user authentication flow"""
    
    def test_login_with_valid_credentials(self):
        """Test login with test@example.com / password123"""
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful for {data['user']['email']}")
    
    def test_login_with_invalid_credentials(self):
        """Test login with wrong password"""
        temp_session = requests.Session()
        temp_session.headers.update({"Content-Type": "application/json"})
        response = temp_session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401, f"Expected 401 for invalid credentials, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")
    
    def test_get_current_user(self):
        """Test getting current user after login"""
        # First ensure we are logged in
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Get me failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        print(f"✓ Got current user: {data['email']}")


class TestCartOperations:
    """Test cart CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def ensure_logged_in(self):
        """Ensure user is logged in before each test"""
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
    
    def get_first_product(self):
        """Helper to get first product"""
        response = session.get(f"{BASE_URL}/api/products")
        if response.status_code == 200 and len(response.json()) > 0:
            return response.json()[0]
        return None
    
    def test_get_cart(self):
        """Test getting cart"""
        response = session.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 200, f"Get cart failed: {response.text}"
        data = response.json()
        assert "items" in data
        print(f"✓ Cart retrieved with {len(data['items'])} items")
    
    def test_add_to_cart(self):
        """Test adding item to cart"""
        product = self.get_first_product()
        assert product is not None, "No products available"
        
        size = product["sizes"][0] if product.get("sizes") else "M"
        
        response = session.post(
            f"{BASE_URL}/api/cart/add",
            json={
                "product_id": product["product_id"],
                "size": size,
                "quantity": 1
            }
        )
        assert response.status_code == 200, f"Add to cart failed: {response.text}"
        
        # Verify item was added by getting cart
        cart_response = session.get(f"{BASE_URL}/api/cart")
        assert cart_response.status_code == 200
        cart = cart_response.json()
        
        # Check if product is in cart
        product_ids_in_cart = [item["product_id"] for item in cart["items"]]
        assert product["product_id"] in product_ids_in_cart, "Product not found in cart after add"
        print(f"✓ Added {product['title']} to cart")
    
    def test_update_cart_quantity(self):
        """Test updating cart item quantity"""
        product = self.get_first_product()
        assert product is not None, "No products available"
        
        size = product["sizes"][0] if product.get("sizes") else "M"
        
        # First ensure item is in cart
        session.post(
            f"{BASE_URL}/api/cart/add",
            json={
                "product_id": product["product_id"],
                "size": size,
                "quantity": 1
            }
        )
        
        # Update quantity
        response = session.put(
            f"{BASE_URL}/api/cart/update/{product['product_id']}/{size}",
            json={"quantity": 2}
        )
        assert response.status_code == 200, f"Update cart failed: {response.text}"
        
        # Verify quantity was updated
        cart_response = session.get(f"{BASE_URL}/api/cart")
        cart = cart_response.json()
        for item in cart["items"]:
            if item["product_id"] == product["product_id"] and item["size"] == size:
                assert item["quantity"] == 2, f"Quantity not updated, expected 2 got {item['quantity']}"
                break
        print(f"✓ Updated cart item quantity to 2")
    
    def test_get_cart_count(self):
        """Test getting cart count"""
        response = session.get(f"{BASE_URL}/api/cart/count")
        assert response.status_code == 200, f"Get cart count failed: {response.text}"
        data = response.json()
        assert "count" in data
        print(f"✓ Cart count: {data['count']}")
    
    def test_remove_from_cart(self):
        """Test removing item from cart"""
        product = self.get_first_product()
        assert product is not None, "No products available"
        
        size = product["sizes"][0] if product.get("sizes") else "M"
        
        # First ensure item is in cart
        session.post(
            f"{BASE_URL}/api/cart/add",
            json={
                "product_id": product["product_id"],
                "size": size,
                "quantity": 1
            }
        )
        
        # Remove item
        response = session.delete(
            f"{BASE_URL}/api/cart/remove/{product['product_id']}/{size}"
        )
        assert response.status_code == 200, f"Remove from cart failed: {response.text}"
        
        # Verify item was removed
        cart_response = session.get(f"{BASE_URL}/api/cart")
        cart = cart_response.json()
        for item in cart["items"]:
            if item["product_id"] == product["product_id"] and item["size"] == size:
                pytest.fail("Item still in cart after remove")
        print(f"✓ Removed item from cart")


class TestCheckoutFlow:
    """Test complete checkout flow - the main test for this feature"""
    
    @pytest.fixture(autouse=True)
    def ensure_logged_in(self):
        """Ensure user is logged in before each test"""
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
    
    def get_first_product(self):
        """Helper to get first product"""
        response = session.get(f"{BASE_URL}/api/products")
        if response.status_code == 200 and len(response.json()) > 0:
            return response.json()[0]
        return None
    
    def test_full_checkout_flow_with_cod(self):
        """Test complete checkout: add to cart -> place order with COD"""
        product = self.get_first_product()
        assert product is not None, "No products available"
        
        size = product["sizes"][0] if product.get("sizes") else "M"
        
        # Step 1: Clear cart first
        session.delete(f"{BASE_URL}/api/cart/clear")
        print("Step 1: ✓ Cart cleared")
        
        # Step 2: Add product to cart
        add_response = session.post(
            f"{BASE_URL}/api/cart/add",
            json={
                "product_id": product["product_id"],
                "size": size,
                "quantity": 1
            }
        )
        assert add_response.status_code == 200, f"Add to cart failed: {add_response.text}"
        print(f"Step 2: ✓ Added {product['title']} to cart")
        
        # Step 3: Verify cart has the item
        cart_response = session.get(f"{BASE_URL}/api/cart")
        assert cart_response.status_code == 200
        cart = cart_response.json()
        assert len(cart["items"]) > 0, "Cart is empty"
        print(f"Step 3: ✓ Cart has {len(cart['items'])} item(s)")
        
        # Step 4: Create order with COD
        order_data = {
            "items": [{
                "product_id": product["product_id"],
                "product_title": product["title"],
                "product_image": product["images"][0] if product.get("images") else "",
                "size": size,
                "quantity": 1,
                "price": product["discounted_price"],
                "subtotal": product["discounted_price"]
            }],
            "payment_method": "cod",
            "delivery_address": {
                "name": "Test User",
                "phone": "9876543210",
                "addressLine1": "123 Test Street",
                "addressLine2": "Apt 456",
                "city": "New Delhi",
                "state": "Delhi",
                "pincode": "110001"
            },
            "pincode": "110001"
        }
        
        order_response = session.post(
            f"{BASE_URL}/api/orders",
            json=order_data
        )
        assert order_response.status_code == 200, f"Create order failed: {order_response.text}"
        order = order_response.json()
        assert "order_id" in order
        assert order["payment_method"] == "cod"
        assert order["order_status"] == "confirmed"  # COD orders should be confirmed immediately
        print(f"Step 4: ✓ Order created: {order['order_id']}")
        
        # Step 5: Verify order was created by fetching it
        get_order_response = session.get(f"{BASE_URL}/api/orders/{order['order_id']}")
        assert get_order_response.status_code == 200, f"Get order failed: {get_order_response.text}"
        fetched_order = get_order_response.json()
        assert fetched_order["order_id"] == order["order_id"]
        assert fetched_order["total"] > 0
        print(f"Step 5: ✓ Order verified, total: ₹{fetched_order['total']}")
        
        # Step 6: Verify order appears in my orders
        my_orders_response = session.get(f"{BASE_URL}/api/orders")
        assert my_orders_response.status_code == 200
        my_orders = my_orders_response.json()
        order_ids = [o["order_id"] for o in my_orders]
        assert order["order_id"] in order_ids, "Order not found in my orders"
        print(f"Step 6: ✓ Order appears in my orders list")
    
    def test_razorpay_mock_order_creation(self):
        """Test Razorpay mock order creation"""
        response = session.post(
            f"{BASE_URL}/api/orders/create-razorpay-order",
            json={"amount": 100000}  # ₹1000 in paise
        )
        assert response.status_code == 200, f"Create Razorpay order failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data.get("mock") == True, "Expected mock Razorpay order"
        print(f"✓ Mock Razorpay order created: {data['id']}")


class TestOrderManagement:
    """Test order retrieval"""
    
    @pytest.fixture(autouse=True)
    def ensure_logged_in(self):
        """Ensure user is logged in before each test"""
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
    
    def test_get_my_orders(self):
        """Test getting user's orders"""
        response = session.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200, f"Get my orders failed: {response.text}"
        orders = response.json()
        assert isinstance(orders, list)
        print(f"✓ Retrieved {len(orders)} order(s)")


class TestGSTSettings:
    """Test GST settings retrieval"""
    
    @pytest.fixture(autouse=True)
    def ensure_logged_in(self):
        """Ensure user is logged in before each test"""
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
    
    def test_get_gst(self):
        """Test getting GST percentage"""
        response = session.get(f"{BASE_URL}/api/admin/gst")
        assert response.status_code == 200, f"Get GST failed: {response.text}"
        data = response.json()
        assert "gst_percentage" in data
        assert data["gst_percentage"] >= 0
        print(f"✓ GST percentage: {data['gst_percentage']}%")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
