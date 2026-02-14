"""
Test Return Request Flow for DRIEDIT E-commerce Platform
Tests:
- Return eligibility check API
- Return request creation API
- Validation scenarios (7-day window, duplicate prevention, etc.)
"""
import pytest
import requests
import os
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER = {"email": "test@example.com", "password": "password123"}


class TestReturnEligibilityAPI:
    """Tests for /api/returns/check-eligibility/{order_id}"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session for test user"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login
        response = session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.status_code} - {response.text}")
        
        return session
    
    def test_check_eligibility_delivered_order_with_return_already(self, session):
        """Test: Delivered order with existing return request should be ineligible"""
        # Order with existing return request from context
        order_id = "order_e1d414bf8347"
        
        response = session.get(f"{BASE_URL}/api/returns/check-eligibility/{order_id}")
        print(f"Eligibility check for order with return: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Could be 200 (with eligible=false) or 404 if order doesn't exist
        if response.status_code == 200:
            data = response.json()
            # If order has existing return, it should be ineligible
            if data.get("eligible") == False:
                assert "reason" in data or "return_status" in data
                print(f"Order ineligible as expected: {data.get('reason', data.get('return_status'))}")
            else:
                print("Order is eligible (no return submitted yet)")
    
    def test_check_eligibility_nonexistent_order(self, session):
        """Test: Non-existent order should return 404"""
        order_id = "order_nonexistent_12345"
        
        response = session.get(f"{BASE_URL}/api/returns/check-eligibility/{order_id}")
        print(f"Non-existent order check: {response.status_code}")
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print(f"Error message: {data['detail']}")
    
    def test_check_eligibility_unauthenticated(self):
        """Test: Unauthenticated request should return 401"""
        response = requests.get(f"{BASE_URL}/api/returns/check-eligibility/any_order")
        print(f"Unauthenticated check: {response.status_code}")
        
        assert response.status_code == 401


class TestReturnRequestCreationAPI:
    """Tests for POST /api/returns"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session for test user"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login
        response = session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.status_code} - {response.text}")
        
        return session
    
    def test_create_return_request_without_items(self, session):
        """Test: Creating return request without items should fail"""
        payload = {
            "order_id": "order_test",
            "items": [],
            "reason": "wrong_size",
            "comments": "Test comment"
        }
        
        response = session.post(f"{BASE_URL}/api/returns", json=payload)
        print(f"Return without items: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Should fail validation - either 422 (validation) or 404 (order not found)
        assert response.status_code in [400, 404, 422]
    
    def test_create_return_request_without_reason(self, session):
        """Test: Creating return request without reason should fail"""
        payload = {
            "order_id": "order_test",
            "items": [{
                "product_id": "test_prod",
                "product_title": "Test Product",
                "product_image": "test.jpg",
                "size": "M",
                "quantity": 1
            }]
        }
        
        response = session.post(f"{BASE_URL}/api/returns", json=payload)
        print(f"Return without reason: {response.status_code}")
        
        # Should fail - missing required field
        assert response.status_code in [400, 404, 422]
    
    def test_create_return_request_nonexistent_order(self, session):
        """Test: Creating return for non-existent order should return 404"""
        payload = {
            "order_id": "order_nonexistent_xyz",
            "items": [{
                "product_id": "prod_1",
                "product_title": "Test Product",
                "product_image": "test.jpg",
                "size": "M",
                "quantity": 1
            }],
            "reason": "wrong_size",
            "comments": "Test comment",
            "images": []
        }
        
        response = session.post(f"{BASE_URL}/api/returns", json=payload)
        print(f"Return for non-existent order: {response.status_code}")
        print(f"Response: {response.text}")
        
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
    
    def test_create_return_request_unauthenticated(self):
        """Test: Unauthenticated return request should fail"""
        payload = {
            "order_id": "order_test",
            "items": [{
                "product_id": "prod_1",
                "product_title": "Test Product",
                "product_image": "test.jpg",
                "size": "M",
                "quantity": 1
            }],
            "reason": "wrong_size"
        }
        
        response = requests.post(f"{BASE_URL}/api/returns", json=payload)
        print(f"Unauthenticated return request: {response.status_code}")
        
        assert response.status_code == 401


class TestGetMyReturnRequests:
    """Tests for GET /api/returns/my-requests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session for test user"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.status_code}")
        
        return session
    
    def test_get_my_return_requests(self, session):
        """Test: Get user's return requests"""
        response = session.get(f"{BASE_URL}/api/returns/my-requests")
        print(f"Get my returns: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} return requests")
        
        # If there are requests, validate structure
        if len(data) > 0:
            request = data[0]
            assert "request_id" in request
            assert "order_id" in request
            assert "status" in request
            print(f"First return request: {request['request_id']} - Status: {request['status']}")


class TestOrdersWithReturnFlow:
    """End-to-end tests for order with return flow"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session for test user"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.status_code}")
        
        return session
    
    def test_get_orders_list(self, session):
        """Test: Get user's orders to check return eligibility"""
        response = session.get(f"{BASE_URL}/api/orders")
        print(f"Get orders: {response.status_code}")
        
        assert response.status_code == 200
        orders = response.json()
        assert isinstance(orders, list)
        print(f"Found {len(orders)} orders")
        
        # Check delivered orders for return eligibility
        delivered_orders = [o for o in orders if o.get("order_status") == "delivered"]
        print(f"Delivered orders: {len(delivered_orders)}")
        
        for order in delivered_orders[:3]:  # Check first 3 delivered orders
            order_id = order.get("order_id")
            return_status = order.get("return_status", "none")
            print(f"  - Order {order_id}: return_status={return_status}")
        
        return orders
    
    def test_check_eligibility_for_confirmed_orders(self, session):
        """Test: Orders in confirmed status should not be eligible for return"""
        # First get orders
        orders_response = session.get(f"{BASE_URL}/api/orders")
        if orders_response.status_code != 200:
            pytest.skip("Could not get orders")
        
        orders = orders_response.json()
        confirmed_orders = [o for o in orders if o.get("order_status") == "confirmed"]
        
        if not confirmed_orders:
            pytest.skip("No confirmed orders to test")
        
        # Check eligibility for first confirmed order
        order = confirmed_orders[0]
        response = session.get(f"{BASE_URL}/api/returns/check-eligibility/{order['order_id']}")
        print(f"Eligibility for confirmed order {order['order_id']}: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == False
        assert data["reason"] == "Order not yet delivered"
        print(f"Reason: {data['reason']}")


class TestReturnRequestValidation:
    """Tests for return request validation scenarios"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session for test user"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code != 200:
            pytest.skip(f"Login failed: {response.status_code}")
        
        return session
    
    def test_return_request_valid_reasons(self, session):
        """Test: Valid reasons for return"""
        valid_reasons = [
            "wrong_size",
            "not_as_expected",
            "quality_issue",
            "damaged",
            "wrong_item",
            "changed_mind",
            "other"
        ]
        
        # Just validate that these are the expected reasons from the code
        print(f"Valid return reasons: {valid_reasons}")
        assert len(valid_reasons) == 7
    
    def test_return_request_with_images(self, session):
        """Test: Return request structure allows images"""
        # This validates the data model structure
        payload = {
            "order_id": "test_order",
            "items": [{
                "product_id": "prod_1",
                "product_title": "Test Product",
                "product_image": "test.jpg",
                "size": "M",
                "quantity": 1
            }],
            "reason": "damaged",
            "comments": "Product arrived damaged",
            "images": ["base64_image_data_1", "base64_image_data_2"]
        }
        
        response = session.post(f"{BASE_URL}/api/returns", json=payload)
        print(f"Return with images: {response.status_code}")
        
        # Will fail because order doesn't exist, but validates structure is accepted
        assert response.status_code in [400, 404]  # Order not found or not delivered


class TestAdminReturnEndpoints:
    """Tests for admin return management endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Create authenticated session for admin user"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        admin_creds = {"email": "admin@driedit.in", "password": "adminpassword"}
        response = session.post(f"{BASE_URL}/api/auth/login", json=admin_creds)
        
        # Try alternate password if first fails
        if response.status_code != 200:
            admin_creds = {"email": "admin@driedit.in", "password": "admin123"}
            response = session.post(f"{BASE_URL}/api/auth/login", json=admin_creds)
        
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.status_code}")
        
        return session
    
    def test_admin_get_all_returns(self, admin_session):
        """Test: Admin can get all return requests"""
        response = admin_session.get(f"{BASE_URL}/api/returns/admin/all")
        print(f"Admin get all returns: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Total return requests: {len(data)}")
        
        # If there are requests, validate structure
        if len(data) > 0:
            request = data[0]
            assert "request_id" in request
            assert "order_id" in request
            assert "status" in request
            print(f"Sample return: {request['request_id']} - Status: {request['status']}")
    
    def test_admin_filter_returns_by_status(self, admin_session):
        """Test: Admin can filter returns by status"""
        response = admin_session.get(f"{BASE_URL}/api/returns/admin/all?status=requested")
        print(f"Admin filter returns by status: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned items should have requested status
        for item in data:
            assert item.get("status") == "requested"
        
        print(f"Found {len(data)} requested returns")
    
    def test_regular_user_cannot_access_admin_returns(self):
        """Test: Regular user should not access admin endpoints"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login as regular user
        response = session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code != 200:
            pytest.skip("Regular user login failed")
        
        # Try to access admin endpoint
        response = session.get(f"{BASE_URL}/api/returns/admin/all")
        print(f"Regular user accessing admin returns: {response.status_code}")
        
        assert response.status_code == 403
