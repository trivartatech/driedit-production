"""
Test module for Product Recommendations API
Tests the GET /api/products/{product_id}/recommendations endpoint
Verifies:
- Returns max 4 products
- Same category products prioritized
- Best sellers fill remaining slots
- Current product excluded from recommendations
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')

class TestProductRecommendations:
    """Product recommendations endpoint tests"""
    
    # Test product IDs from seed data
    TSHIRT_PRODUCT_ID = "prod_0f924be0e9c6"  # T-Shirts category
    PANTS_PRODUCT_ID = "prod_cdcb8cc5c98f"   # Pants category
    HOODIE_PRODUCT_ID = "prod_837d3e0ebfdc"  # Hoodies category
    TSHIRT_CATEGORY_ID = "cat_fd9804952363"
    
    def test_recommendations_returns_four_products(self):
        """Verify recommendations return max 4 products by default"""
        response = requests.get(f"{BASE_URL}/api/products/{self.TSHIRT_PRODUCT_ID}/recommendations")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 4
    
    def test_recommendations_respects_limit_parameter(self):
        """Verify limit parameter restricts number of returned products"""
        response = requests.get(f"{BASE_URL}/api/products/{self.TSHIRT_PRODUCT_ID}/recommendations?limit=2")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
    
    def test_recommendations_excludes_current_product(self):
        """Verify current product is NOT in recommendations"""
        response = requests.get(f"{BASE_URL}/api/products/{self.TSHIRT_PRODUCT_ID}/recommendations")
        
        assert response.status_code == 200
        data = response.json()
        product_ids = [p["product_id"] for p in data]
        assert self.TSHIRT_PRODUCT_ID not in product_ids
    
    def test_recommendations_prioritizes_same_category(self):
        """Verify same category products are prioritized first"""
        # Get the current product's category
        product_response = requests.get(f"{BASE_URL}/api/products/{self.TSHIRT_PRODUCT_ID}")
        assert product_response.status_code == 200
        current_category_id = product_response.json()["category_id"]
        
        # Get recommendations
        response = requests.get(f"{BASE_URL}/api/products/{self.TSHIRT_PRODUCT_ID}/recommendations")
        assert response.status_code == 200
        data = response.json()
        
        # Check that first items are same category
        same_category_count = sum(1 for p in data if p["category_id"] == current_category_id)
        assert same_category_count >= 1, "At least one same category product should be in recommendations"
        
        # Verify same category products come first (prioritized)
        if same_category_count > 0:
            first_product = data[0]
            assert first_product["category_id"] == current_category_id, "First recommendation should be same category"
    
    def test_recommendations_includes_best_sellers_from_other_categories(self):
        """Verify best sellers from other categories fill remaining slots"""
        response = requests.get(f"{BASE_URL}/api/products/{self.TSHIRT_PRODUCT_ID}/recommendations")
        
        assert response.status_code == 200
        data = response.json()
        
        # Get unique categories in recommendations
        categories = set(p["category_name"] for p in data)
        assert len(categories) > 1, "Recommendations should include products from multiple categories"
    
    def test_recommendations_only_includes_in_stock_products(self):
        """Verify only in-stock products are recommended"""
        response = requests.get(f"{BASE_URL}/api/products/{self.TSHIRT_PRODUCT_ID}/recommendations")
        
        assert response.status_code == 200
        data = response.json()
        
        for product in data:
            assert product["stock"] > 0, f"Product {product['product_id']} has zero stock but was recommended"
    
    def test_recommendations_has_correct_product_structure(self):
        """Verify recommended products have all required fields"""
        response = requests.get(f"{BASE_URL}/api/products/{self.TSHIRT_PRODUCT_ID}/recommendations")
        
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["product_id", "title", "category_id", "category_name", 
                          "regular_price", "discounted_price", "sizes", "stock", 
                          "images", "description"]
        
        for product in data:
            for field in required_fields:
                assert field in product, f"Missing field: {field}"
    
    def test_recommendations_sorted_by_sales_count(self):
        """Verify same-category products are sorted by sales_count (descending)"""
        response = requests.get(f"{BASE_URL}/api/products/{self.TSHIRT_PRODUCT_ID}/recommendations")
        
        assert response.status_code == 200
        data = response.json()
        
        # Filter same category products
        same_category_products = [p for p in data if p["category_id"] == self.TSHIRT_CATEGORY_ID]
        
        if len(same_category_products) > 1:
            # Verify sorted by sales_count descending
            for i in range(len(same_category_products) - 1):
                assert same_category_products[i]["sales_count"] >= same_category_products[i+1]["sales_count"], \
                    "Same category products should be sorted by sales_count descending"
    
    def test_recommendations_for_invalid_product_returns_404(self):
        """Verify 404 returned for non-existent product"""
        response = requests.get(f"{BASE_URL}/api/products/invalid_product_id/recommendations")
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Product not found"
    
    def test_recommendations_for_pants_category(self):
        """Test recommendations for Pants category product"""
        response = requests.get(f"{BASE_URL}/api/products/{self.PANTS_PRODUCT_ID}/recommendations")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 4
        
        # Verify current product excluded
        product_ids = [p["product_id"] for p in data]
        assert self.PANTS_PRODUCT_ID not in product_ids
    
    def test_recommendations_for_hoodie_category(self):
        """Test recommendations for Hoodies category product"""
        response = requests.get(f"{BASE_URL}/api/products/{self.HOODIE_PRODUCT_ID}/recommendations")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 4
        
        # Verify current product excluded
        product_ids = [p["product_id"] for p in data]
        assert self.HOODIE_PRODUCT_ID not in product_ids
    
    def test_recommendations_no_duplicates(self):
        """Verify no duplicate products in recommendations"""
        response = requests.get(f"{BASE_URL}/api/products/{self.TSHIRT_PRODUCT_ID}/recommendations")
        
        assert response.status_code == 200
        data = response.json()
        
        product_ids = [p["product_id"] for p in data]
        assert len(product_ids) == len(set(product_ids)), "Recommendations contain duplicate products"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
