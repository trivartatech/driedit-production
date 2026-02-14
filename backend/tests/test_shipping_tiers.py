"""
Shipping Tier System Tests
Tests tier-based shipping calculation for DRIEDIT e-commerce platform.
- Admin CRUD operations for shipping tiers
- Public shipping calculation based on subtotal (before GST)
- Overlap validation
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if BASE_URL:
    BASE_URL = BASE_URL.rstrip('/')

# Test Credentials
ADMIN_EMAIL = "admin@driedit.in"
ADMIN_PASSWORD = "adminpassword"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "password123"


class TestShippingTierCalculation:
    """Public endpoint - Calculate shipping based on subtotal"""
    
    def test_calculate_shipping_low_subtotal(self):
        """₹300 subtotal should get ₹80 shipping (0-499 tier)"""
        response = requests.get(f"{BASE_URL}/api/shipping-tiers/calculate?subtotal=300")
        assert response.status_code == 200
        data = response.json()
        assert data["subtotal"] == 300.0
        assert data["shipping_charge"] == 80.0
        assert data["tier_matched"] == True
        print(f"✓ ₹300 subtotal -> ₹80 shipping")
    
    def test_calculate_shipping_medium_subtotal(self):
        """₹700 subtotal should get ₹50 shipping (500-999 tier)"""
        response = requests.get(f"{BASE_URL}/api/shipping-tiers/calculate?subtotal=700")
        assert response.status_code == 200
        data = response.json()
        assert data["subtotal"] == 700.0
        assert data["shipping_charge"] == 50.0
        assert data["tier_matched"] == True
        print(f"✓ ₹700 subtotal -> ₹50 shipping")
    
    def test_calculate_shipping_high_subtotal(self):
        """₹1500 subtotal should get FREE shipping (1000+ tier)"""
        response = requests.get(f"{BASE_URL}/api/shipping-tiers/calculate?subtotal=1500")
        assert response.status_code == 200
        data = response.json()
        assert data["subtotal"] == 1500.0
        assert data["shipping_charge"] == 0.0
        assert data["tier_matched"] == True
        print(f"✓ ₹1500 subtotal -> FREE shipping")
    
    def test_calculate_shipping_boundary_499(self):
        """₹499 subtotal should still get ₹80 shipping (0-499 tier)"""
        response = requests.get(f"{BASE_URL}/api/shipping-tiers/calculate?subtotal=499")
        assert response.status_code == 200
        data = response.json()
        assert data["shipping_charge"] == 80.0
        print(f"✓ ₹499 subtotal -> ₹80 shipping (boundary)")
    
    def test_calculate_shipping_boundary_500(self):
        """₹500 subtotal should get ₹50 shipping (500-999 tier)"""
        response = requests.get(f"{BASE_URL}/api/shipping-tiers/calculate?subtotal=500")
        assert response.status_code == 200
        data = response.json()
        assert data["shipping_charge"] == 50.0
        print(f"✓ ₹500 subtotal -> ₹50 shipping (boundary)")
    
    def test_calculate_shipping_boundary_999(self):
        """₹999 subtotal should get ₹50 shipping (500-999 tier)"""
        response = requests.get(f"{BASE_URL}/api/shipping-tiers/calculate?subtotal=999")
        assert response.status_code == 200
        data = response.json()
        assert data["shipping_charge"] == 50.0
        print(f"✓ ₹999 subtotal -> ₹50 shipping (boundary)")
    
    def test_calculate_shipping_boundary_1000(self):
        """₹1000 subtotal should get FREE shipping (1000+ tier)"""
        response = requests.get(f"{BASE_URL}/api/shipping-tiers/calculate?subtotal=1000")
        assert response.status_code == 200
        data = response.json()
        assert data["shipping_charge"] == 0.0
        print(f"✓ ₹1000 subtotal -> FREE shipping (boundary)")
    
    def test_calculate_shipping_zero(self):
        """₹0 subtotal should get ₹80 shipping (0-499 tier)"""
        response = requests.get(f"{BASE_URL}/api/shipping-tiers/calculate?subtotal=0")
        assert response.status_code == 200
        data = response.json()
        assert data["shipping_charge"] == 80.0
        print(f"✓ ₹0 subtotal -> ₹80 shipping")
    
    def test_calculate_shipping_negative_fails(self):
        """Negative subtotal should fail"""
        response = requests.get(f"{BASE_URL}/api/shipping-tiers/calculate?subtotal=-100")
        assert response.status_code == 400
        print(f"✓ Negative subtotal rejected")


class TestShippingTierPublicList:
    """Public endpoint - Get all active tiers"""
    
    def test_get_active_tiers(self):
        """Should return list of active tiers sorted by min_amount"""
        response = requests.get(f"{BASE_URL}/api/shipping-tiers/all-active")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # 3 seeded tiers
        
        # Verify sorted order
        for i in range(len(data) - 1):
            assert data[i]["min_amount"] <= data[i+1]["min_amount"]
        
        # Verify all are active
        for tier in data:
            assert tier["is_active"] == True
        
        print(f"✓ Got {len(data)} active tiers, sorted correctly")


class TestShippingTierAdminCRUD:
    """Admin endpoints - CRUD operations for shipping tiers"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200
        self.cookies = login_response.cookies
        self.headers = {"Content-Type": "application/json"}
        yield
    
    def test_admin_get_all_tiers(self):
        """Admin can see all tiers including inactive"""
        response = requests.get(
            f"{BASE_URL}/api/shipping-tiers/admin/all",
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin fetched {len(data)} tiers (including inactive)")
    
    def test_admin_create_tier(self):
        """Admin can create new shipping tier"""
        # Create test tier in non-overlapping range
        test_tier = {
            "min_amount": 5000,
            "max_amount": 5499,
            "shipping_charge": 30,
            "is_active": False  # Inactive to avoid overlap
        }
        
        response = requests.post(
            f"{BASE_URL}/api/shipping-tiers/admin/create",
            json=test_tier,
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        assert data["min_amount"] == 5000
        assert data["max_amount"] == 5499
        assert data["shipping_charge"] == 30
        assert "tier_id" in data
        
        # Cleanup
        tier_id = data["tier_id"]
        requests.delete(
            f"{BASE_URL}/api/shipping-tiers/admin/{tier_id}",
            cookies=self.cookies
        )
        print(f"✓ Created and cleaned up test tier {tier_id}")
    
    def test_admin_create_tier_validation(self):
        """Cannot create tier with invalid amounts"""
        # Max < Min
        response = requests.post(
            f"{BASE_URL}/api/shipping-tiers/admin/create",
            json={
                "min_amount": 1000,
                "max_amount": 500,
                "shipping_charge": 50,
                "is_active": False
            },
            cookies=self.cookies
        )
        assert response.status_code == 400
        print(f"✓ Rejected tier with max_amount < min_amount")
        
        # Negative amount
        response = requests.post(
            f"{BASE_URL}/api/shipping-tiers/admin/create",
            json={
                "min_amount": -100,
                "max_amount": 500,
                "shipping_charge": 50,
                "is_active": False
            },
            cookies=self.cookies
        )
        assert response.status_code == 400
        print(f"✓ Rejected tier with negative min_amount")
    
    def test_admin_update_tier(self):
        """Admin can update shipping tier"""
        # Create a test tier first
        create_response = requests.post(
            f"{BASE_URL}/api/shipping-tiers/admin/create",
            json={
                "min_amount": 6000,
                "max_amount": 6499,
                "shipping_charge": 20,
                "is_active": False
            },
            cookies=self.cookies
        )
        assert create_response.status_code == 200
        tier_id = create_response.json()["tier_id"]
        
        # Update the tier
        update_response = requests.put(
            f"{BASE_URL}/api/shipping-tiers/admin/{tier_id}",
            json={"shipping_charge": 15},
            cookies=self.cookies
        )
        assert update_response.status_code == 200
        assert update_response.json()["shipping_charge"] == 15
        print(f"✓ Updated tier shipping charge to ₹15")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/shipping-tiers/admin/{tier_id}",
            cookies=self.cookies
        )
    
    def test_admin_toggle_tier(self):
        """Admin can toggle tier active/inactive"""
        # Create test tier (active - non-overlapping range)
        create_response = requests.post(
            f"{BASE_URL}/api/shipping-tiers/admin/create",
            json={
                "min_amount": 7000,
                "max_amount": 7499,
                "shipping_charge": 10,
                "is_active": True  # Start active since range doesn't overlap
            },
            cookies=self.cookies
        )
        tier_id = create_response.json()["tier_id"]
        
        # Toggle to inactive
        toggle_response = requests.put(
            f"{BASE_URL}/api/shipping-tiers/admin/{tier_id}/toggle",
            cookies=self.cookies
        )
        assert toggle_response.status_code == 200
        assert toggle_response.json()["is_active"] == False
        print(f"✓ Toggled tier to inactive")
        
        # Toggle back to active
        toggle_response = requests.put(
            f"{BASE_URL}/api/shipping-tiers/admin/{tier_id}/toggle",
            cookies=self.cookies
        )
        assert toggle_response.status_code == 200
        assert toggle_response.json()["is_active"] == True
        print(f"✓ Toggled tier to active")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/shipping-tiers/admin/{tier_id}",
            cookies=self.cookies
        )
    
    def test_admin_delete_tier(self):
        """Admin can delete shipping tier"""
        # Create test tier
        create_response = requests.post(
            f"{BASE_URL}/api/shipping-tiers/admin/create",
            json={
                "min_amount": 8000,
                "max_amount": 8499,
                "shipping_charge": 5,
                "is_active": False
            },
            cookies=self.cookies
        )
        tier_id = create_response.json()["tier_id"]
        
        # Delete the tier
        delete_response = requests.delete(
            f"{BASE_URL}/api/shipping-tiers/admin/{tier_id}",
            cookies=self.cookies
        )
        assert delete_response.status_code == 200
        assert "deleted" in delete_response.json()["message"].lower()
        print(f"✓ Deleted tier {tier_id}")
        
        # Verify deleted
        get_response = requests.get(
            f"{BASE_URL}/api/shipping-tiers/admin/all",
            cookies=self.cookies
        )
        tiers = get_response.json()
        tier_ids = [t["tier_id"] for t in tiers]
        assert tier_id not in tier_ids
        print(f"✓ Verified tier no longer exists")
    
    def test_admin_delete_nonexistent_tier(self):
        """Delete non-existent tier returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/shipping-tiers/admin/tier_nonexistent123",
            cookies=self.cookies
        )
        assert response.status_code == 404
        print(f"✓ 404 for non-existent tier delete")


class TestShippingTierOverlapPrevention:
    """Test tier range overlap validation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        self.cookies = login_response.cookies
        yield
    
    def test_create_overlapping_tier_rejected(self):
        """Cannot create active tier that overlaps existing active tiers"""
        # Try to create tier overlapping with 0-499 tier (active)
        response = requests.post(
            f"{BASE_URL}/api/shipping-tiers/admin/create",
            json={
                "min_amount": 200,
                "max_amount": 600,
                "shipping_charge": 40,
                "is_active": True  # Active = will check overlap
            },
            cookies=self.cookies
        )
        assert response.status_code == 400
        assert "overlap" in response.json()["detail"].lower()
        print(f"✓ Rejected overlapping tier creation")
    
    def test_inactive_tier_no_overlap_check(self):
        """Can create inactive tier in overlapping range"""
        # Create inactive tier in overlapping range
        response = requests.post(
            f"{BASE_URL}/api/shipping-tiers/admin/create",
            json={
                "min_amount": 200,
                "max_amount": 300,
                "shipping_charge": 45,
                "is_active": False  # Inactive = no overlap check
            },
            cookies=self.cookies
        )
        assert response.status_code == 200
        tier_id = response.json()["tier_id"]
        print(f"✓ Created inactive tier in overlapping range")
        
        # But activating it should fail
        toggle_response = requests.put(
            f"{BASE_URL}/api/shipping-tiers/admin/{tier_id}/toggle",
            cookies=self.cookies
        )
        assert toggle_response.status_code == 400
        assert "overlap" in toggle_response.json()["detail"].lower()
        print(f"✓ Cannot activate overlapping tier")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/shipping-tiers/admin/{tier_id}",
            cookies=self.cookies
        )


class TestShippingTierUnauthorized:
    """Test authentication requirements for admin endpoints"""
    
    def test_create_without_auth(self):
        """Cannot create tier without authentication"""
        response = requests.post(
            f"{BASE_URL}/api/shipping-tiers/admin/create",
            json={
                "min_amount": 10000,
                "max_amount": 10499,
                "shipping_charge": 0,
                "is_active": False
            }
        )
        assert response.status_code == 401
        print(f"✓ Unauthorized create rejected")
    
    def test_admin_list_without_auth(self):
        """Cannot access admin tier list without auth"""
        response = requests.get(f"{BASE_URL}/api/shipping-tiers/admin/all")
        assert response.status_code == 401
        print(f"✓ Unauthorized admin list rejected")
    
    def test_regular_user_cannot_access_admin(self):
        """Regular user cannot access admin endpoints"""
        # Login as regular user
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        cookies = login_response.cookies
        
        # Try to create tier
        response = requests.post(
            f"{BASE_URL}/api/shipping-tiers/admin/create",
            json={
                "min_amount": 10000,
                "max_amount": 10499,
                "shipping_charge": 0,
                "is_active": False
            },
            cookies=cookies
        )
        assert response.status_code == 403
        print(f"✓ Regular user cannot access admin endpoints")


class TestOrderWithShippingTier:
    """Test order creation with tier-based shipping"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get user token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        self.cookies = login_response.cookies
        yield
    
    def test_order_shipping_calculation_displayed(self):
        """Verify shipping tier info in calculate endpoint matches tier rules"""
        # Test low subtotal
        response = requests.get(f"{BASE_URL}/api/shipping-tiers/calculate?subtotal=400")
        assert response.status_code == 200
        data = response.json()
        assert data["shipping_charge"] == 80.0
        assert data["tier_range"] == "₹0.0 - ₹499.0"
        print(f"✓ Low subtotal shipping tier info correct")
        
        # Test medium subtotal
        response = requests.get(f"{BASE_URL}/api/shipping-tiers/calculate?subtotal=800")
        assert response.status_code == 200
        data = response.json()
        assert data["shipping_charge"] == 50.0
        assert "500" in data["tier_range"]
        print(f"✓ Medium subtotal shipping tier info correct")
        
        # Test high subtotal (free shipping)
        response = requests.get(f"{BASE_URL}/api/shipping-tiers/calculate?subtotal=2000")
        assert response.status_code == 200
        data = response.json()
        assert data["shipping_charge"] == 0.0
        assert data["message"] == "Free shipping"
        print(f"✓ High subtotal free shipping info correct")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
