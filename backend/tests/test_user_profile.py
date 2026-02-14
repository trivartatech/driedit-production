"""
User Profile & Address Management Tests
Tests profile CRUD, address CRUD, phone validation, pincode validation, max addresses limit
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestProfileEndpoints:
    """Test user profile CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self, auth_session):
        """Use authenticated session"""
        self.session = auth_session
    
    def test_get_profile_authenticated(self):
        """GET /api/user/profile - should return user profile with addresses"""
        response = self.session.get(f"{BASE_URL}/api/user/profile")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        assert "addresses" in data
        assert isinstance(data["addresses"], list)
        print(f"PASS: Profile loaded with {len(data['addresses'])} addresses")
    
    def test_get_profile_unauthenticated(self, api_client):
        """GET /api/user/profile - should return 401 without auth"""
        # Create new session without cookies
        response = requests.get(f"{BASE_URL}/api/user/profile")
        assert response.status_code == 401
        print("PASS: Unauthenticated profile access returns 401")
    
    def test_update_profile_name_valid(self):
        """PUT /api/user/profile - update name with valid value"""
        response = self.session.put(
            f"{BASE_URL}/api/user/profile",
            json={"name": "Test User Updated"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "user" in data
        assert data["user"]["name"] == "Test User Updated"
        print("PASS: Profile name updated successfully")
    
    def test_update_profile_name_short(self):
        """PUT /api/user/profile - reject name < 2 characters"""
        response = self.session.put(
            f"{BASE_URL}/api/user/profile",
            json={"name": "A"}
        )
        assert response.status_code == 400
        assert "at least 2 characters" in response.json().get("detail", "")
        print("PASS: Short name rejected correctly")


class TestPhoneValidation:
    """Test Indian phone number validation (10-digit starting 6-9)"""
    
    @pytest.fixture(autouse=True)
    def setup(self, auth_session):
        self.session = auth_session
    
    def test_phone_valid_starting_6(self):
        """Phone starting with 6 should be accepted"""
        response = self.session.put(
            f"{BASE_URL}/api/user/profile",
            json={"phone": "6123456789"}
        )
        assert response.status_code == 200
        print("PASS: Phone starting with 6 accepted")
    
    def test_phone_valid_starting_7(self):
        """Phone starting with 7 should be accepted"""
        response = self.session.put(
            f"{BASE_URL}/api/user/profile",
            json={"phone": "7123456789"}
        )
        assert response.status_code == 200
        print("PASS: Phone starting with 7 accepted")
    
    def test_phone_valid_starting_8(self):
        """Phone starting with 8 should be accepted"""
        response = self.session.put(
            f"{BASE_URL}/api/user/profile",
            json={"phone": "8123456789"}
        )
        assert response.status_code == 200
        print("PASS: Phone starting with 8 accepted")
    
    def test_phone_valid_starting_9(self):
        """Phone starting with 9 should be accepted"""
        response = self.session.put(
            f"{BASE_URL}/api/user/profile",
            json={"phone": "9876543210"}
        )
        assert response.status_code == 200
        print("PASS: Phone starting with 9 accepted")
    
    def test_phone_invalid_starting_5(self):
        """Phone starting with 5 should be rejected"""
        response = self.session.put(
            f"{BASE_URL}/api/user/profile",
            json={"phone": "5123456789"}
        )
        assert response.status_code == 400
        assert "Invalid phone" in response.json().get("detail", "")
        print("PASS: Phone starting with 5 rejected")
    
    def test_phone_invalid_starting_0(self):
        """Phone starting with 0 should be rejected"""
        response = self.session.put(
            f"{BASE_URL}/api/user/profile",
            json={"phone": "0123456789"}
        )
        assert response.status_code == 400
        print("PASS: Phone starting with 0 rejected")
    
    def test_phone_invalid_too_short(self):
        """Phone with < 10 digits should be rejected"""
        response = self.session.put(
            f"{BASE_URL}/api/user/profile",
            json={"phone": "912345"}
        )
        assert response.status_code == 400
        print("PASS: Short phone number rejected")


class TestAddressEndpoints:
    """Test address CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self, auth_session):
        self.session = auth_session
        self.test_address_ids = []
    
    def teardown_method(self):
        """Cleanup test addresses"""
        for addr_id in self.test_address_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/user/addresses/{addr_id}")
            except:
                pass
    
    def test_get_addresses(self):
        """GET /api/user/addresses - should return addresses list"""
        response = self.session.get(f"{BASE_URL}/api/user/addresses")
        assert response.status_code == 200
        
        data = response.json()
        assert "addresses" in data
        assert "count" in data
        assert "max_allowed" in data
        assert data["max_allowed"] == 5
        print(f"PASS: Got {data['count']} addresses (max: {data['max_allowed']})")
    
    def test_add_address_valid(self):
        """POST /api/user/addresses - add valid address"""
        unique_name = f"TEST_User_{uuid.uuid4().hex[:6]}"
        response = self.session.post(
            f"{BASE_URL}/api/user/addresses",
            json={
                "label": "Other",
                "name": unique_name,
                "phone": "9876543210",
                "address_line1": "123 Test Street",
                "address_line2": "Near Park",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "is_default": False
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "address" in data
        assert data["address"]["name"] == unique_name
        
        # Save for cleanup
        self.test_address_ids.append(data["address"]["address_id"])
        print(f"PASS: Address added with ID {data['address']['address_id']}")
    
    def test_add_address_invalid_phone(self):
        """POST /api/user/addresses - reject invalid phone"""
        response = self.session.post(
            f"{BASE_URL}/api/user/addresses",
            json={
                "label": "Other",
                "name": "Test",
                "phone": "1234567890",  # Starts with 1, invalid
                "address_line1": "123 Test",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            }
        )
        assert response.status_code == 400
        assert "Invalid phone" in response.json().get("detail", "")
        print("PASS: Invalid phone rejected")
    
    def test_add_address_invalid_pincode(self):
        """POST /api/user/addresses - reject invalid pincode"""
        response = self.session.post(
            f"{BASE_URL}/api/user/addresses",
            json={
                "label": "Other",
                "name": "Test",
                "phone": "9876543210",
                "address_line1": "123 Test",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "12345"  # 5 digits, invalid
            }
        )
        # Pydantic validation returns 422
        assert response.status_code in [400, 422]
        print("PASS: Invalid pincode rejected")
    
    def test_update_address(self):
        """PUT /api/user/addresses/{id} - update existing address"""
        # First create an address
        create_resp = self.session.post(
            f"{BASE_URL}/api/user/addresses",
            json={
                "label": "Other",
                "name": "Original Name",
                "phone": "9876543210",
                "address_line1": "Original Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            }
        )
        assert create_resp.status_code == 200
        addr_id = create_resp.json()["address"]["address_id"]
        self.test_address_ids.append(addr_id)
        
        # Update it
        update_resp = self.session.put(
            f"{BASE_URL}/api/user/addresses/{addr_id}",
            json={
                "name": "Updated Name",
                "address_line1": "Updated Street"
            }
        )
        assert update_resp.status_code == 200
        
        # Verify
        data = update_resp.json()
        assert data["address"]["name"] == "Updated Name"
        assert data["address"]["address_line1"] == "Updated Street"
        print("PASS: Address updated successfully")
    
    def test_delete_address(self):
        """DELETE /api/user/addresses/{id} - delete address"""
        # Create an address
        create_resp = self.session.post(
            f"{BASE_URL}/api/user/addresses",
            json={
                "label": "Other",
                "name": "To Delete",
                "phone": "9876543210",
                "address_line1": "Delete Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            }
        )
        assert create_resp.status_code == 200
        addr_id = create_resp.json()["address"]["address_id"]
        
        # Delete it
        delete_resp = self.session.delete(f"{BASE_URL}/api/user/addresses/{addr_id}")
        assert delete_resp.status_code == 200
        
        # Verify it's gone - should not be in list
        get_resp = self.session.get(f"{BASE_URL}/api/user/addresses")
        addresses = get_resp.json()["addresses"]
        found = any(a["address_id"] == addr_id for a in addresses)
        assert not found, "Deleted address should not be in list"
        print("PASS: Address deleted successfully")
    
    def test_set_default_address(self):
        """PUT /api/user/addresses/{id}/set-default - set as default"""
        # Get current addresses
        get_resp = self.session.get(f"{BASE_URL}/api/user/addresses")
        addresses = get_resp.json()["addresses"]
        
        if len(addresses) < 2:
            pytest.skip("Need at least 2 addresses to test set-default")
        
        # Find a non-default address
        non_default = next((a for a in addresses if not a["is_default"]), None)
        if not non_default:
            pytest.skip("All addresses are default")
        
        # Set it as default
        response = self.session.put(
            f"{BASE_URL}/api/user/addresses/{non_default['address_id']}/set-default"
        )
        assert response.status_code == 200
        
        # Verify
        verify_resp = self.session.get(f"{BASE_URL}/api/user/addresses")
        new_addresses = verify_resp.json()["addresses"]
        
        new_default = next((a for a in new_addresses if a["is_default"]), None)
        assert new_default is not None
        assert new_default["address_id"] == non_default["address_id"]
        print(f"PASS: Set default address to {non_default['label']}")


class TestMaxAddressesLimit:
    """Test that max 5 addresses limit is enforced"""
    
    @pytest.fixture(autouse=True)
    def setup(self, auth_session):
        self.session = auth_session
        self.created_addresses = []
    
    def teardown_method(self):
        """Cleanup test addresses"""
        for addr_id in self.created_addresses:
            try:
                self.session.delete(f"{BASE_URL}/api/user/addresses/{addr_id}")
            except:
                pass
    
    def test_max_addresses_enforced(self):
        """Should not allow more than 5 addresses"""
        # Get current count
        resp = self.session.get(f"{BASE_URL}/api/user/addresses")
        initial_count = resp.json()["count"]
        
        # Calculate how many we can add
        can_add = 5 - initial_count
        
        # Try to add addresses up to the limit
        for i in range(can_add + 1):  # +1 to go over limit
            response = self.session.post(
                f"{BASE_URL}/api/user/addresses",
                json={
                    "label": "Other",
                    "name": f"TEST_Limit_{i}",
                    "phone": "9876543210",
                    "address_line1": f"Limit Test {i}",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "pincode": "400001"
                }
            )
            
            if i < can_add:
                # Should succeed
                if response.status_code == 200:
                    self.created_addresses.append(response.json()["address"]["address_id"])
                else:
                    pytest.fail(f"Failed to add address {i}: {response.text}")
            else:
                # Should fail - we're at the limit
                assert response.status_code == 400, f"Expected 400 when over limit, got {response.status_code}"
                assert "up to 5" in response.json().get("detail", "").lower() or "5 addresses" in response.json().get("detail", "").lower()
                print(f"PASS: Max 5 addresses limit enforced (tried to add {i+1}th)")
                break


class TestAddressLabels:
    """Test address label types"""
    
    @pytest.fixture(autouse=True)
    def setup(self, auth_session):
        self.session = auth_session
        self.test_ids = []
    
    def teardown_method(self):
        for addr_id in self.test_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/user/addresses/{addr_id}")
            except:
                pass
    
    @pytest.mark.parametrize("label", ["Home", "Work", "Other"])
    def test_address_label_types(self, label):
        """Test all valid label types"""
        response = self.session.post(
            f"{BASE_URL}/api/user/addresses",
            json={
                "label": label,
                "name": f"TEST_{label}_User",
                "phone": "9876543210",
                "address_line1": f"{label} Address Test",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["address"]["label"] == label
        self.test_ids.append(data["address"]["address_id"])
        print(f"PASS: Label '{label}' works correctly")
