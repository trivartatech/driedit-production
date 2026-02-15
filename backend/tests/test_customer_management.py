"""
Customer Management Module Tests
Testing: List/Search/Filter customers, Customer detail page, Status toggle, CSV/Excel exports
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCustomerManagement:
    """Tests for admin customer management endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Login as admin and return authenticated session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@driedit.in",
            "password": "adminpassword"
        })
        
        if login_resp.status_code != 200:
            pytest.skip(f"Admin login failed: {login_resp.status_code}")
        
        return session
    
    # --- Customer List Tests ---
    
    def test_get_customers_list_success(self, admin_session):
        """Test getting paginated customer list"""
        response = admin_session.get(f"{BASE_URL}/api/admin/customers")
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "customers" in data
        assert "total" in data
        assert "page" in data
        assert "per_page" in data
        assert "total_pages" in data
        
        # Validate customers array
        assert isinstance(data["customers"], list)
        assert data["total"] >= 0
        
        # Check customer object structure if there are customers
        if data["customers"]:
            customer = data["customers"][0]
            assert "user_id" in customer
            assert "name" in customer
            assert "email" in customer
            assert "total_orders" in customer
            assert "total_spend" in customer
            assert "is_active" in customer
        
        print(f"PASS: Found {data['total']} customers, page {data['page']} of {data['total_pages']}")
    
    def test_get_customers_pagination(self, admin_session):
        """Test pagination parameters"""
        # Request page 1 with 2 items per page
        response = admin_session.get(f"{BASE_URL}/api/admin/customers", params={
            "page": 1,
            "per_page": 2
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["page"] == 1
        assert data["per_page"] == 2
        
        # Max per_page should be 2 for this request
        assert len(data["customers"]) <= 2
        
        print(f"PASS: Pagination working - {len(data['customers'])} items returned")
    
    def test_search_by_name(self, admin_session):
        """Test search by customer name"""
        # First get a customer name
        list_resp = admin_session.get(f"{BASE_URL}/api/admin/customers")
        if list_resp.status_code == 200 and list_resp.json().get("customers"):
            customer_name = list_resp.json()["customers"][0]["name"]
            
            # Search by part of the name
            search_term = customer_name.split()[0] if ' ' in customer_name else customer_name[:3]
            
            response = admin_session.get(f"{BASE_URL}/api/admin/customers", params={
                "search": search_term
            })
            
            assert response.status_code == 200
            data = response.json()
            
            # Should find at least the original customer
            assert data["total"] >= 1
            print(f"PASS: Search by name '{search_term}' found {data['total']} customers")
        else:
            pytest.skip("No customers to test search")
    
    def test_search_by_email(self, admin_session):
        """Test search by email"""
        response = admin_session.get(f"{BASE_URL}/api/admin/customers", params={
            "search": "@"  # Partial email search
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Should find customers with @ in email
        if data["customers"]:
            for customer in data["customers"]:
                assert "@" in customer["email"]
        
        print(f"PASS: Search by email found {data['total']} customers")
    
    def test_filter_by_status_active(self, admin_session):
        """Test filtering by active status"""
        response = admin_session.get(f"{BASE_URL}/api/admin/customers", params={
            "status": "active"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned customers should be active
        for customer in data["customers"]:
            assert customer["is_active"] == True
        
        print(f"PASS: Active status filter returned {data['total']} active customers")
    
    def test_filter_by_status_inactive(self, admin_session):
        """Test filtering by inactive status"""
        response = admin_session.get(f"{BASE_URL}/api/admin/customers", params={
            "status": "inactive"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned customers should be inactive
        for customer in data["customers"]:
            assert customer["is_active"] == False
        
        print(f"PASS: Inactive status filter returned {data['total']} inactive customers")
    
    def test_filter_by_date_range(self, admin_session):
        """Test filtering by date range"""
        response = admin_session.get(f"{BASE_URL}/api/admin/customers", params={
            "from_date": "2020-01-01",
            "to_date": "2030-12-31"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return all customers within wide date range
        assert data["total"] >= 0
        print(f"PASS: Date range filter found {data['total']} customers")
    
    # --- Customer Detail Tests ---
    
    def test_get_customer_detail_success(self, admin_session):
        """Test getting customer detail by ID"""
        # First get a customer ID
        list_resp = admin_session.get(f"{BASE_URL}/api/admin/customers")
        if list_resp.status_code != 200 or not list_resp.json().get("customers"):
            pytest.skip("No customers available for detail test")
        
        customer_id = list_resp.json()["customers"][0]["user_id"]
        
        response = admin_session.get(f"{BASE_URL}/api/admin/customers/{customer_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "profile" in data
        assert "orders" in data
        assert "returns" in data
        assert "financial_summary" in data
        assert "return_summary" in data
        
        # Validate profile
        profile = data["profile"]
        assert "user_id" in profile
        assert "name" in profile
        assert "email" in profile
        assert "is_active" in profile
        
        # Validate financial summary
        fin = data["financial_summary"]
        assert "total_orders" in fin
        assert "total_spend" in fin
        assert "avg_order_value" in fin
        assert "total_items" in fin
        
        # Validate return summary
        ret = data["return_summary"]
        assert "total_returns" in ret
        assert "pending" in ret
        assert "completed" in ret
        assert "rejected" in ret
        
        print(f"PASS: Customer detail retrieved for {profile['name']}")
    
    def test_get_customer_detail_not_found(self, admin_session):
        """Test 404 for non-existent customer"""
        response = admin_session.get(f"{BASE_URL}/api/admin/customers/nonexistent_user_123")
        
        assert response.status_code == 404
        print("PASS: 404 returned for non-existent customer")
    
    # --- Status Toggle Tests ---
    
    def test_toggle_customer_status(self, admin_session):
        """Test activating/deactivating a customer"""
        # Get a customer
        list_resp = admin_session.get(f"{BASE_URL}/api/admin/customers")
        if list_resp.status_code != 200 or not list_resp.json().get("customers"):
            pytest.skip("No customers available for status toggle test")
        
        customer = list_resp.json()["customers"][0]
        customer_id = customer["user_id"]
        original_status = customer["is_active"]
        
        # Toggle status - deactivate if active, activate if inactive
        new_status = not original_status
        response = admin_session.put(
            f"{BASE_URL}/api/admin/customers/{customer_id}/status",
            json={"is_active": new_status}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] == new_status
        
        # Verify by getting customer detail
        detail_resp = admin_session.get(f"{BASE_URL}/api/admin/customers/{customer_id}")
        assert detail_resp.status_code == 200
        assert detail_resp.json()["profile"]["is_active"] == new_status
        
        # Restore original status
        restore_resp = admin_session.put(
            f"{BASE_URL}/api/admin/customers/{customer_id}/status",
            json={"is_active": original_status}
        )
        assert restore_resp.status_code == 200
        
        print(f"PASS: Status toggled {original_status} -> {new_status} -> {original_status}")
    
    def test_toggle_status_invalid_customer(self, admin_session):
        """Test 404 when toggling non-existent customer"""
        response = admin_session.put(
            f"{BASE_URL}/api/admin/customers/nonexistent_123/status",
            json={"is_active": True}
        )
        
        assert response.status_code == 404
        print("PASS: 404 returned for non-existent customer status toggle")
    
    # --- Export Tests ---
    
    def test_export_csv(self, admin_session):
        """Test CSV export"""
        response = admin_session.get(f"{BASE_URL}/api/admin/customers/export/csv")
        
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("Content-Type", "")
        
        # Check for Content-Disposition header
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp
        assert ".csv" in content_disp
        
        # Verify CSV content
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        
        # Should have header row
        assert len(lines) >= 1
        header = lines[0]
        assert "Customer ID" in header
        assert "Name" in header
        assert "Email" in header
        
        print(f"PASS: CSV export with {len(lines) - 1} customer rows")
    
    def test_export_csv_with_filters(self, admin_session):
        """Test CSV export with filters"""
        response = admin_session.get(f"{BASE_URL}/api/admin/customers/export/csv", params={
            "status": "active",
            "from_date": "2020-01-01"
        })
        
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("Content-Type", "")
        
        print("PASS: CSV export with filters working")
    
    def test_export_excel(self, admin_session):
        """Test Excel export"""
        response = admin_session.get(f"{BASE_URL}/api/admin/customers/export/excel")
        
        # Could be 200 (success) or 501 (openpyxl not installed)
        if response.status_code == 501:
            print("SKIP: Excel export not available (openpyxl not installed)")
            pytest.skip("Excel export not available")
        
        assert response.status_code == 200
        
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheetml" in content_type or "excel" in content_type.lower()
        
        # Check Content-Disposition
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp
        assert ".xlsx" in content_disp
        
        # Verify binary content exists
        assert len(response.content) > 0
        
        print(f"PASS: Excel export with {len(response.content)} bytes")
    
    # --- Edge Cases ---
    
    def test_get_customers_without_auth(self):
        """Test that unauthenticated requests are rejected"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/admin/customers")
        
        # Should get 401 or 403
        assert response.status_code in [401, 403]
        print("PASS: Unauthenticated request rejected")
    
    def test_get_customers_as_non_admin(self):
        """Test that non-admin users cannot access customer management"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Try to register/login as regular user
        # First check if we have a test user
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testuser@test.com",
            "password": "testpassword123"
        })
        
        if response.status_code == 200:
            # Try to access admin endpoint
            admin_resp = session.get(f"{BASE_URL}/api/admin/customers")
            assert admin_resp.status_code in [401, 403]
            print("PASS: Non-admin user rejected from customer management")
        else:
            print("SKIP: No test user available for non-admin test")
    
    def test_invalid_pagination_params(self, admin_session):
        """Test handling of invalid pagination parameters"""
        # Page 0 should be rejected or handled gracefully
        response = admin_session.get(f"{BASE_URL}/api/admin/customers", params={
            "page": 0,
            "per_page": 200  # Above max limit
        })
        
        # Should either return 422 (validation error) or handle gracefully
        # FastAPI with Query validation should return 422 for page < 1
        assert response.status_code in [200, 422]
        
        if response.status_code == 422:
            print("PASS: Invalid pagination params properly rejected")
        else:
            print("PASS: Invalid pagination params handled gracefully")
    
    def test_empty_search_results(self, admin_session):
        """Test empty search results"""
        response = admin_session.get(f"{BASE_URL}/api/admin/customers", params={
            "search": "nonexistent_user_xyz123456789"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["customers"] == []
        assert data["total"] == 0
        
        print("PASS: Empty search results handled correctly")
