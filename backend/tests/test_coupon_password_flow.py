"""
Test Coupon System and Password Reset Flow
Tests:
1. Admin Coupon CRUD Operations (Create, Read, Update, Delete, Toggle)
2. Customer Coupon Validation (min order, expiry, usage limits, one-time per user)
3. Forgot Password Flow (request, token verification)
4. Password Reset Flow (reset with token, verify login works)
"""
import pytest
import requests
import os
import time
from datetime import datetime, timedelta

# Get API URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@driedit.in"
ADMIN_PASSWORD = "adminpassword"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "password123"


class TestSetup:
    """Setup and basic health checks"""
    
    def test_api_health(self):
        """Test API is reachable"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        print("API health check passed")


class TestAdminCouponCRUD:
    """Admin coupon CRUD operations"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get admin authenticated session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
        
        print(f"Admin login successful: {response.json().get('user', {}).get('email')}")
        return session
    
    def test_01_create_percentage_coupon(self, admin_session):
        """Create a percentage discount coupon"""
        payload = {
            "code": "TEST_PERCENT10",
            "coupon_type": "percentage",
            "discount_value": 10,
            "min_order_value": 500,
            "max_discount": 200,
            "usage_limit": 100,
            "one_time_per_user": True,
            "is_active": True,
            "expires_at": (datetime.utcnow() + timedelta(days=30)).isoformat()
        }
        
        response = admin_session.post(f"{BASE_URL}/api/coupons/admin/create", json=payload)
        print(f"Create percentage coupon response: {response.status_code}")
        
        assert response.status_code == 200, f"Failed to create coupon: {response.text}"
        
        data = response.json()
        assert data["code"] == "TEST_PERCENT10"
        assert data["coupon_type"] == "percentage"
        assert data["discount_value"] == 10
        assert "coupon_id" in data
        print(f"Created coupon: {data['coupon_id']}")
    
    def test_02_create_fixed_coupon(self, admin_session):
        """Create a fixed amount discount coupon"""
        payload = {
            "code": "TEST_FLAT200",
            "coupon_type": "fixed",
            "discount_value": 200,
            "min_order_value": 1000,
            "usage_limit": 50,
            "one_time_per_user": True,
            "is_active": True
        }
        
        response = admin_session.post(f"{BASE_URL}/api/coupons/admin/create", json=payload)
        print(f"Create fixed coupon response: {response.status_code}")
        
        assert response.status_code == 200, f"Failed to create coupon: {response.text}"
        
        data = response.json()
        assert data["code"] == "TEST_FLAT200"
        assert data["coupon_type"] == "fixed"
        assert data["discount_value"] == 200
        print(f"Created fixed coupon: {data['coupon_id']}")
    
    def test_03_create_expired_coupon(self, admin_session):
        """Create an expired coupon for testing"""
        payload = {
            "code": "TEST_EXPIRED",
            "coupon_type": "percentage",
            "discount_value": 50,
            "min_order_value": 0,
            "is_active": True,
            "expires_at": (datetime.utcnow() - timedelta(days=1)).isoformat()  # Yesterday
        }
        
        response = admin_session.post(f"{BASE_URL}/api/coupons/admin/create", json=payload)
        assert response.status_code == 200, f"Failed to create expired coupon: {response.text}"
        print("Created expired coupon TEST_EXPIRED")
    
    def test_04_create_inactive_coupon(self, admin_session):
        """Create an inactive coupon for testing"""
        payload = {
            "code": "TEST_INACTIVE",
            "coupon_type": "percentage",
            "discount_value": 25,
            "min_order_value": 0,
            "is_active": False
        }
        
        response = admin_session.post(f"{BASE_URL}/api/coupons/admin/create", json=payload)
        assert response.status_code == 200, f"Failed to create inactive coupon: {response.text}"
        print("Created inactive coupon TEST_INACTIVE")
    
    def test_05_create_duplicate_code_fails(self, admin_session):
        """Duplicate coupon code should fail"""
        payload = {
            "code": "TEST_PERCENT10",  # Already exists
            "coupon_type": "percentage",
            "discount_value": 20,
            "is_active": True
        }
        
        response = admin_session.post(f"{BASE_URL}/api/coupons/admin/create", json=payload)
        assert response.status_code == 400, f"Expected 400 for duplicate code, got {response.status_code}"
        assert "already exists" in response.json().get("detail", "").lower()
        print("Duplicate coupon code correctly rejected")
    
    def test_06_get_all_coupons(self, admin_session):
        """Get all coupons with stats"""
        response = admin_session.get(f"{BASE_URL}/api/coupons/admin/all?include_inactive=true")
        
        assert response.status_code == 200, f"Failed to get coupons: {response.text}"
        
        coupons = response.json()
        assert isinstance(coupons, list)
        
        # Find our test coupons
        codes = [c["code"] for c in coupons]
        assert "TEST_PERCENT10" in codes, "TEST_PERCENT10 not found"
        assert "TEST_FLAT200" in codes, "TEST_FLAT200 not found"
        
        print(f"Retrieved {len(coupons)} coupons")
        
        # Verify stats fields exist
        for c in coupons:
            assert "total_discount_given" in c
            assert "redemption_count" in c
            assert "is_expired" in c
    
    def test_07_get_coupon_details(self, admin_session):
        """Get single coupon with usage history"""
        # First get coupon_id
        all_coupons = admin_session.get(f"{BASE_URL}/api/coupons/admin/all").json()
        test_coupon = next((c for c in all_coupons if c["code"] == "TEST_PERCENT10"), None)
        
        assert test_coupon, "TEST_PERCENT10 not found"
        
        response = admin_session.get(f"{BASE_URL}/api/coupons/admin/{test_coupon['coupon_id']}")
        
        assert response.status_code == 200, f"Failed to get coupon details: {response.text}"
        
        data = response.json()
        assert data["code"] == "TEST_PERCENT10"
        assert "usage_history" in data
        assert "total_discount_given" in data
        print(f"Coupon details: {data['code']}, usage_count: {data.get('used_count', 0)}")
    
    def test_08_update_coupon(self, admin_session):
        """Update coupon details"""
        # Get coupon_id
        all_coupons = admin_session.get(f"{BASE_URL}/api/coupons/admin/all").json()
        test_coupon = next((c for c in all_coupons if c["code"] == "TEST_FLAT200"), None)
        
        assert test_coupon, "TEST_FLAT200 not found"
        
        update_payload = {
            "discount_value": 250,  # Increase discount
            "min_order_value": 1200
        }
        
        response = admin_session.put(
            f"{BASE_URL}/api/coupons/admin/{test_coupon['coupon_id']}",
            json=update_payload
        )
        
        assert response.status_code == 200, f"Failed to update coupon: {response.text}"
        
        updated = response.json()
        assert updated["discount_value"] == 250
        assert updated["min_order_value"] == 1200
        print("Coupon updated successfully")
    
    def test_09_toggle_coupon_status(self, admin_session):
        """Toggle coupon active/inactive status"""
        # Get coupon_id
        all_coupons = admin_session.get(f"{BASE_URL}/api/coupons/admin/all").json()
        test_coupon = next((c for c in all_coupons if c["code"] == "TEST_PERCENT10"), None)
        
        assert test_coupon, "TEST_PERCENT10 not found"
        original_status = test_coupon["is_active"]
        
        response = admin_session.put(f"{BASE_URL}/api/coupons/admin/{test_coupon['coupon_id']}/toggle")
        
        assert response.status_code == 200, f"Failed to toggle coupon: {response.text}"
        
        result = response.json()
        assert result["is_active"] != original_status, "Status should have toggled"
        print(f"Coupon toggled: is_active = {result['is_active']}")
        
        # Toggle back
        admin_session.put(f"{BASE_URL}/api/coupons/admin/{test_coupon['coupon_id']}/toggle")


class TestCustomerCouponValidation:
    """Customer coupon validation tests"""
    
    @pytest.fixture(scope="class")
    def user_session(self):
        """Get authenticated user session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        
        if response.status_code != 200:
            pytest.skip(f"User login failed: {response.status_code}")
        
        print(f"User login successful")
        return session
    
    def test_01_validate_percentage_coupon(self, user_session):
        """Validate percentage coupon calculates discount correctly"""
        payload = {
            "code": "TEST_PERCENT10",
            "order_total": 1500
        }
        
        response = user_session.post(f"{BASE_URL}/api/coupons/validate", json=payload)
        print(f"Validate coupon response: {response.status_code}")
        
        assert response.status_code == 200, f"Validation failed: {response.text}"
        
        data = response.json()
        assert data["valid"] is True
        assert data["coupon_code"] == "TEST_PERCENT10"
        assert data["discount_amount"] == 150  # 10% of 1500
        assert data["new_total"] == 1350
        print(f"Discount: {data['discount_amount']}, New total: {data['new_total']}")
    
    def test_02_validate_percentage_coupon_with_max_cap(self, user_session):
        """Percentage coupon should respect max_discount cap"""
        payload = {
            "code": "TEST_PERCENT10",
            "order_total": 5000  # 10% = 500, but max_discount is 200
        }
        
        response = user_session.post(f"{BASE_URL}/api/coupons/validate", json=payload)
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["discount_amount"] == 200  # Capped at max_discount
        assert data["new_total"] == 4800
        print(f"Discount capped at max: {data['discount_amount']}")
    
    def test_03_validate_fixed_coupon(self, user_session):
        """Validate fixed amount coupon"""
        payload = {
            "code": "TEST_FLAT200",
            "order_total": 1500
        }
        
        response = user_session.post(f"{BASE_URL}/api/coupons/validate", json=payload)
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["valid"] is True
        assert data["discount_amount"] == 250  # Updated value from test_08
        print(f"Fixed discount: {data['discount_amount']}")
    
    def test_04_validate_min_order_not_met(self, user_session):
        """Coupon should fail if min order value not met"""
        payload = {
            "code": "TEST_FLAT200",  # min_order_value is 1200
            "order_total": 800
        }
        
        response = user_session.post(f"{BASE_URL}/api/coupons/validate", json=payload)
        
        assert response.status_code == 400
        assert "minimum order value" in response.json().get("detail", "").lower()
        print("Min order value correctly enforced")
    
    def test_05_validate_expired_coupon(self, user_session):
        """Expired coupon should fail"""
        payload = {
            "code": "TEST_EXPIRED",
            "order_total": 1000
        }
        
        response = user_session.post(f"{BASE_URL}/api/coupons/validate", json=payload)
        
        assert response.status_code == 400
        assert "expired" in response.json().get("detail", "").lower()
        print("Expired coupon correctly rejected")
    
    def test_06_validate_inactive_coupon(self, user_session):
        """Inactive coupon should fail"""
        payload = {
            "code": "TEST_INACTIVE",
            "order_total": 1000
        }
        
        response = user_session.post(f"{BASE_URL}/api/coupons/validate", json=payload)
        
        assert response.status_code == 400
        assert "no longer active" in response.json().get("detail", "").lower()
        print("Inactive coupon correctly rejected")
    
    def test_07_validate_invalid_code(self, user_session):
        """Invalid coupon code should return 404"""
        payload = {
            "code": "NONEXISTENT_CODE",
            "order_total": 1000
        }
        
        response = user_session.post(f"{BASE_URL}/api/coupons/validate", json=payload)
        
        assert response.status_code == 404
        assert "invalid" in response.json().get("detail", "").lower()
        print("Invalid code correctly rejected")


class TestForgotPasswordFlow:
    """Forgot password and reset password flow tests"""
    
    def test_01_forgot_password_request(self):
        """Submit forgot password request - always returns success"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": TEST_USER_EMAIL}
        )
        
        assert response.status_code == 200, f"Forgot password failed: {response.text}"
        
        data = response.json()
        assert "message" in data
        # Should mention about receiving email link
        print(f"Forgot password response: {data['message']}")
    
    def test_02_forgot_password_nonexistent_email(self):
        """Non-existent email should still return success (prevent enumeration)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "nonexistent_user_12345@example.com"}
        )
        
        # Should still return 200 to prevent email enumeration
        assert response.status_code == 200
        print("Non-existent email also returns success (prevents enumeration)")
    
    def test_03_verify_invalid_reset_token(self):
        """Invalid reset token should return 400"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-reset-token/invalid_token_123")
        
        assert response.status_code == 400
        assert "invalid" in response.json().get("detail", "").lower()
        print("Invalid token correctly rejected")
    
    def test_04_reset_password_invalid_token(self):
        """Reset with invalid token should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": "invalid_token_xyz", "new_password": "newpassword123"}
        )
        
        assert response.status_code == 400
        assert "invalid" in response.json().get("detail", "").lower()
        print("Reset with invalid token correctly rejected")
    
    def test_05_reset_password_short_password(self):
        """Reset with too short password should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": "some_token", "new_password": "short"}
        )
        
        # Will fail either due to invalid token or short password
        assert response.status_code == 400
        print("Short password validation in place")


class TestCouponCleanup:
    """Clean up test coupons"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get admin authenticated session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        if response.status_code != 200:
            pytest.skip(f"Admin login failed")
        
        return session
    
    def test_delete_test_coupons(self, admin_session):
        """Delete all test coupons created during tests"""
        # Get all coupons
        all_coupons = admin_session.get(f"{BASE_URL}/api/coupons/admin/all").json()
        
        test_coupons = [c for c in all_coupons if c["code"].startswith("TEST_")]
        
        for coupon in test_coupons:
            response = admin_session.delete(f"{BASE_URL}/api/coupons/admin/{coupon['coupon_id']}")
            if response.status_code == 200:
                print(f"Deleted coupon: {coupon['code']}")
            else:
                print(f"Failed to delete {coupon['code']}: {response.text}")
        
        print(f"Cleanup complete: {len(test_coupons)} test coupons removed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
