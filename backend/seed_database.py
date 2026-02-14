"""
Database seeding script for DRIEDIT
Seeds initial data: categories, products, pincodes, GST settings, hero banners
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Get database
client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

async def seed_database():
    print("🌱 Starting database seeding...")
    
    # Clear existing data
    print("📦 Clearing existing data...")
    await db.categories.delete_many({})
    await db.products.delete_many({})
    await db.pincodes.delete_many({})
    await db.gst_settings.delete_many({})
    await db.hero_banners.delete_many({})
    
    # Seed Categories
    print("📂 Seeding categories...")
    categories = [
        {"category_id": f"cat_{uuid.uuid4().hex[:12]}", "name": "T-Shirts", "slug": "t-shirts", "created_at": datetime.now(timezone.utc)},
        {"category_id": f"cat_{uuid.uuid4().hex[:12]}", "name": "Hoodies", "slug": "hoodies", "created_at": datetime.now(timezone.utc)},
        {"category_id": f"cat_{uuid.uuid4().hex[:12]}", "name": "Jackets", "slug": "jackets", "created_at": datetime.now(timezone.utc)},
        {"category_id": f"cat_{uuid.uuid4().hex[:12]}", "name": "Pants", "slug": "pants", "created_at": datetime.now(timezone.utc)},
        {"category_id": f"cat_{uuid.uuid4().hex[:12]}", "name": "Accessories", "slug": "accessories", "created_at": datetime.now(timezone.utc)},
    ]
    await db.categories.insert_many(categories)
    print(f"✅ Created {len(categories)} categories")
    
    # Seed Products
    print("👕 Seeding products...")
    products = [
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "title": "OVERSIZED GRAPHIC TEE",
            "category_id": categories[0]["category_id"],
            "category_name": "T-Shirts",
            "regular_price": 1999,
            "discounted_price": 1299,
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "stock": 50,
            "images": [
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop",
                "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=1000&fit=crop"
            ],
            "description": "Premium cotton oversized fit graphic tee. Perfect for streetwear aesthetic. Unisex design with bold prints.",
            "sales_count": 145,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "title": "BLACK HOODIE ESSENTIAL",
            "category_id": categories[1]["category_id"],
            "category_name": "Hoodies",
            "regular_price": 2999,
            "discounted_price": 1999,
            "sizes": ["M", "L", "XL", "XXL"],
            "stock": 30,
            "images": [
                "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=1000&fit=crop",
                "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&h=1000&fit=crop"
            ],
            "description": "Heavy-weight cotton hoodie. Classic black with minimal branding. Perfect for layering.",
            "sales_count": 98,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "title": "DENIM JACKET VINTAGE",
            "category_id": categories[2]["category_id"],
            "category_name": "Jackets",
            "regular_price": 4999,
            "discounted_price": 3499,
            "sizes": ["S", "M", "L", "XL"],
            "stock": 20,
            "images": [
                "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop",
                "https://images.unsplash.com/photo-1543076659-9380cdf10613?w=800&h=1000&fit=crop"
            ],
            "description": "Premium denim jacket with distressed finish. Vintage wash. True streetwear staple.",
            "sales_count": 67,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "title": "CARGO PANTS BLACK",
            "category_id": categories[3]["category_id"],
            "category_name": "Pants",
            "regular_price": 3499,
            "discounted_price": 2299,
            "sizes": ["28", "30", "32", "34", "36"],
            "stock": 40,
            "images": [
                "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=1000&fit=crop",
                "https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&h=1000&fit=crop"
            ],
            "description": "Tactical cargo pants with multiple pockets. Adjustable straps. Comfortable fit for everyday wear.",
            "sales_count": 112,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "title": "WHITE MINIMAL TEE",
            "category_id": categories[0]["category_id"],
            "category_name": "T-Shirts",
            "regular_price": 1499,
            "discounted_price": 999,
            "sizes": ["S", "M", "L", "XL"],
            "stock": 60,
            "images": [
                "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=800&h=1000&fit=crop",
                "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=1000&fit=crop"
            ],
            "description": "Classic white tee with minimal branding. 100% premium cotton. Essential wardrobe piece.",
            "sales_count": 203,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "title": "STRIPE OVERSIZED SHIRT",
            "category_id": categories[0]["category_id"],
            "category_name": "T-Shirts",
            "regular_price": 2499,
            "discounted_price": 1799,
            "sizes": ["M", "L", "XL", "XXL"],
            "stock": 35,
            "images": [
                "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=800&h=1000&fit=crop",
                "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=1000&fit=crop"
            ],
            "description": "Oversized striped shirt. Vintage aesthetic. Perfect for casual streetwear looks.",
            "sales_count": 89,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "title": "RED ACCENT HOODIE",
            "category_id": categories[1]["category_id"],
            "category_name": "Hoodies",
            "regular_price": 3499,
            "discounted_price": 2499,
            "sizes": ["S", "M", "L", "XL"],
            "stock": 25,
            "images": [
                "https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?w=800&h=1000&fit=crop",
                "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=1000&fit=crop"
            ],
            "description": "Black hoodie with signature red accent details. Heavy cotton blend. Limited edition.",
            "sales_count": 76,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "title": "BOMBER JACKET",
            "category_id": categories[2]["category_id"],
            "category_name": "Jackets",
            "regular_price": 5999,
            "discounted_price": 4299,
            "sizes": ["M", "L", "XL"],
            "stock": 15,
            "images": [
                "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1000&fit=crop",
                "https://images.unsplash.com/photo-1580657018950-c7f7d6a6d990?w=800&h=1000&fit=crop"
            ],
            "description": "Classic bomber jacket with modern fit. Satin finish. Essential outerwear piece.",
            "sales_count": 54,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    await db.products.insert_many(products)
    print(f"✅ Created {len(products)} products")
    
    # Seed Pincodes (Major Indian cities)
    print("📮 Seeding pincodes...")
    pincodes = [
        # Mumbai
        {"pincode": "400001", "shipping_charge": 0, "cod_available": True, "created_at": datetime.now(timezone.utc)},
        {"pincode": "400050", "shipping_charge": 0, "cod_available": True, "created_at": datetime.now(timezone.utc)},
        # Delhi
        {"pincode": "110001", "shipping_charge": 0, "cod_available": True, "created_at": datetime.now(timezone.utc)},
        {"pincode": "110019", "shipping_charge": 0, "cod_available": True, "created_at": datetime.now(timezone.utc)},
        # Bangalore
        {"pincode": "560001", "shipping_charge": 0, "cod_available": True, "created_at": datetime.now(timezone.utc)},
        {"pincode": "560100", "shipping_charge": 0, "cod_available": True, "created_at": datetime.now(timezone.utc)},
        # Chennai
        {"pincode": "600001", "shipping_charge": 0, "cod_available": True, "created_at": datetime.now(timezone.utc)},
        # Hyderabad
        {"pincode": "500001", "shipping_charge": 0, "cod_available": True, "created_at": datetime.now(timezone.utc)},
        # Pune
        {"pincode": "411001", "shipping_charge": 0, "cod_available": True, "created_at": datetime.now(timezone.utc)},
        # Kolkata
        {"pincode": "700001", "shipping_charge": 99, "cod_available": True, "created_at": datetime.now(timezone.utc)},
    ]
    await db.pincodes.insert_many(pincodes)
    print(f"✅ Created {len(pincodes)} pincodes")
    
    # Seed GST Settings
    print("💰 Setting up GST...")
    await db.gst_settings.insert_one({
        "gst_percentage": 18.0,
        "updated_at": datetime.now(timezone.utc)
    })
    print("✅ GST settings configured (18%)")
    
    # Seed Hero Banners
    print("🎨 Seeding hero banners...")
    banners = [
        {
            "banner_id": f"banner_{uuid.uuid4().hex[:12]}",
            "image": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&h=600&fit=crop",
            "button_text": "SHOP NEW DROPS",
            "redirect_url": "/products",
            "active": True,
            "order_position": 1,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "banner_id": f"banner_{uuid.uuid4().hex[:12]}",
            "image": "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=1200&h=600&fit=crop",
            "button_text": "EXPLORE COLLECTION",
            "redirect_url": "/products",
            "active": True,
            "order_position": 2,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "banner_id": f"banner_{uuid.uuid4().hex[:12]}",
            "image": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&h=600&fit=crop",
            "button_text": "LIMITED EDITION",
            "redirect_url": "/products",
            "active": True,
            "order_position": 3,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    await db.hero_banners.insert_many(banners)
    print(f"✅ Created {len(banners)} hero banners")
    
    print("\n🎉 Database seeding complete!")
    print(f"   - {len(categories)} categories")
    print(f"   - {len(products)} products")
    print(f"   - {len(pincodes)} serviceable pincodes")
    print(f"   - GST configured at 18%")
    print(f"   - {len(banners)} hero banners")

if __name__ == "__main__":
    asyncio.run(seed_database())
