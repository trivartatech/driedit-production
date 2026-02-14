import pytest
import requests
import os

# Get API URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="session")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="session")
def test_user_credentials():
    """Test user credentials"""
    return {
        "email": "test@example.com",
        "password": "password123"
    }

@pytest.fixture(scope="session")
def auth_session(api_client, test_user_credentials):
    """Authenticated session with session_token cookie"""
    # Login the test user
    response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json=test_user_credentials
    )
    
    if response.status_code == 200:
        # The session_token is set in cookies automatically
        return api_client
    else:
        pytest.skip(f"Login failed with status {response.status_code}: {response.text}")

@pytest.fixture
def first_product(api_client):
    """Get first available product"""
    response = api_client.get(f"{BASE_URL}/api/products")
    if response.status_code == 200 and len(response.json()) > 0:
        return response.json()[0]
    pytest.skip("No products available")
