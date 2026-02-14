// Mock data for DRIEDIT.IN - Gen-Z Streetwear

export const heroSliders = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&h=600&fit=crop",
    buttonText: "SHOP NEW DROPS",
    redirectUrl: "/products",
    active: true
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=1200&h=600&fit=crop",
    buttonText: "EXPLORE COLLECTION",
    redirectUrl: "/products",
    active: true
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&h=600&fit=crop",
    buttonText: "LIMITED EDITION",
    redirectUrl: "/products",
    active: true
  }
];

export const categories = [
  { id: 1, name: "T-Shirts", slug: "t-shirts" },
  { id: 2, name: "Hoodies", slug: "hoodies" },
  { id: 3, name: "Jackets", slug: "jackets" },
  { id: 4, name: "Pants", slug: "pants" },
  { id: 5, name: "Accessories", slug: "accessories" }
];

export const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

export const products = [
  {
    id: 1,
    title: "OVERSIZED GRAPHIC TEE",
    category_id: 1,
    category: "T-Shirts",
    regular_price: 1999,
    discounted_price: 1299,
    sizes: ["S", "M", "L", "XL", "XXL"],
    stock: 50,
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=1000&fit=crop"
    ],
    description: "Premium cotton oversized fit graphic tee. Perfect for streetwear aesthetic. Unisex design with bold prints.",
    sales_count: 145
  },
  {
    id: 2,
    title: "BLACK HOODIE ESSENTIAL",
    category_id: 2,
    category: "Hoodies",
    regular_price: 2999,
    discounted_price: 1999,
    sizes: ["M", "L", "XL", "XXL"],
    stock: 30,
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&h=1000&fit=crop"
    ],
    description: "Heavy-weight cotton hoodie. Classic black with minimal branding. Perfect for layering.",
    sales_count: 98
  },
  {
    id: 3,
    title: "DENIM JACKET VINTAGE",
    category_id: 3,
    category: "Jackets",
    regular_price: 4999,
    discounted_price: 3499,
    sizes: ["S", "M", "L", "XL"],
    stock: 20,
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1543076659-9380cdf10613?w=800&h=1000&fit=crop"
    ],
    description: "Premium denim jacket with distressed finish. Vintage wash. True streetwear staple.",
    sales_count: 67
  },
  {
    id: 4,
    title: "CARGO PANTS BLACK",
    category_id: 4,
    category: "Pants",
    regular_price: 3499,
    discounted_price: 2299,
    sizes: ["28", "30", "32", "34", "36"],
    stock: 40,
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&h=1000&fit=crop"
    ],
    description: "Tactical cargo pants with multiple pockets. Adjustable straps. Comfortable fit for everyday wear.",
    sales_count: 112
  },
  {
    id: 5,
    title: "WHITE MINIMAL TEE",
    category_id: 1,
    category: "T-Shirts",
    regular_price: 1499,
    discounted_price: 999,
    sizes: ["S", "M", "L", "XL"],
    stock: 60,
    images: [
      "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=1000&fit=crop"
    ],
    description: "Classic white tee with minimal branding. 100% premium cotton. Essential wardrobe piece.",
    sales_count: 203
  },
  {
    id: 6,
    title: "STRIPE OVERSIZED SHIRT",
    category_id: 1,
    category: "T-Shirts",
    regular_price: 2499,
    discounted_price: 1799,
    sizes: ["M", "L", "XL", "XXL"],
    stock: 35,
    images: [
      "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=1000&fit=crop"
    ],
    description: "Oversized striped shirt. Vintage aesthetic. Perfect for casual streetwear looks.",
    sales_count: 89
  },
  {
    id: 7,
    title: "RED ACCENT HOODIE",
    category_id: 2,
    category: "Hoodies",
    regular_price: 3499,
    discounted_price: 2499,
    sizes: ["S", "M", "L", "XL"],
    stock: 25,
    images: [
      "https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=1000&fit=crop"
    ],
    description: "Black hoodie with signature red accent details. Heavy cotton blend. Limited edition.",
    sales_count: 76
  },
  {
    id: 8,
    title: "BOMBER JACKET",
    category_id: 3,
    category: "Jackets",
    regular_price: 5999,
    discounted_price: 4299,
    sizes: ["M", "L", "XL"],
    stock: 15,
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1580657018950-c7f7d6a6d990?w=800&h=1000&fit=crop"
    ],
    description: "Classic bomber jacket with modern fit. Satin finish. Essential outerwear piece.",
    sales_count: 54
  }
];

export const popup = {
  id: 1,
  title: "WELCOME TO DRIEDIT",
  description: "Get 10% off on your first order. Use code: DRIP10",
  image: "https://images.unsplash.com/photo-1558769132-cb1aea1c1a1d?w=600&h=400&fit=crop",
  button_text: "SHOP NOW",
  redirect_url: "/products",
  active: true,
  display_type: "once_per_session"
};

export const reviews = [
  {
    id: 1,
    product_id: 1,
    user_name: "Rahul K.",
    rating: 5,
    review_text: "Amazing quality! Oversized fit is perfect. Worth every penny.",
    verified: true,
    created_at: "2025-01-15"
  },
  {
    id: 2,
    product_id: 1,
    user_name: "Priya S.",
    rating: 4,
    review_text: "Great tee, but size runs a bit large. Order one size down.",
    verified: true,
    created_at: "2025-01-10"
  },
  {
    id: 3,
    product_id: 2,
    user_name: "Arjun M.",
    rating: 5,
    review_text: "Best hoodie I've bought! Super comfortable and looks sick.",
    verified: true,
    created_at: "2025-01-20"
  }
];

// Helper functions
export const calculateDiscount = (regular, discounted) => {
  return Math.round(((regular - discounted) / regular) * 100);
};

export const formatPrice = (price) => {
  return `₹${price.toLocaleString('en-IN')}`;
};

// Local storage helpers for wishlist and cart
export const getWishlist = () => {
  const wishlist = localStorage.getItem('driedit_wishlist');
  return wishlist ? JSON.parse(wishlist) : [];
};

export const addToWishlist = (productId) => {
  const wishlist = getWishlist();
  if (!wishlist.includes(productId)) {
    wishlist.push(productId);
    localStorage.setItem('driedit_wishlist', JSON.stringify(wishlist));
  }
  return wishlist;
};

export const removeFromWishlist = (productId) => {
  const wishlist = getWishlist();
  const updated = wishlist.filter(id => id !== productId);
  localStorage.setItem('driedit_wishlist', JSON.stringify(updated));
  return updated;
};

export const getCart = () => {
  const cart = localStorage.getItem('driedit_cart');
  return cart ? JSON.parse(cart) : [];
};

export const addToCart = (productId, size, quantity = 1) => {
  const cart = getCart();
  const existingItem = cart.find(item => item.productId === productId && item.size === size);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ productId, size, quantity });
  }
  
  localStorage.setItem('driedit_cart', JSON.stringify(cart));
  return cart;
};

export const removeFromCart = (productId, size) => {
  const cart = getCart();
  const updated = cart.filter(item => !(item.productId === productId && item.size === size));
  localStorage.setItem('driedit_cart', JSON.stringify(updated));
  return updated;
};

export const updateCartQuantity = (productId, size, quantity) => {
  const cart = getCart();
  const item = cart.find(item => item.productId === productId && item.size === size);
  
  if (item) {
    item.quantity = quantity;
    localStorage.setItem('driedit_cart', JSON.stringify(cart));
  }
  
  return cart;
};

export const clearCart = () => {
  localStorage.removeItem('driedit_cart');
  return [];
};