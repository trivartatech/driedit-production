# DRIEDIT.IN - Gen-Z Fashion E-commerce Platform

## Product Requirements Document

### Original Problem Statement
Build a complete, production-ready, scalable, minimalistic Gen-Z fashion e-commerce platform for a streetwear brand called **DRIEDIT.IN**.

### Tech Stack
- **Frontend**: React, Tailwind CSS, Framer Motion, Axios
- **Backend**: FastAPI, Pydantic
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT (httpOnly cookies), bcrypt, Google OAuth 2.0

### Design Style
- Minimal, bold typography
- Black & white UI with Red accent (#E10600)
- Mobile-first responsive design

---

## What's Been Implemented ✅

### Phase 1: Foundation (Completed)
- [x] Project scaffolding (React + FastAPI + MongoDB)
- [x] Gen-Z aesthetic UI design (black/white/red theme)
- [x] Database models for all collections
- [x] CORS and security middleware

### Phase 2: Authentication (Completed)
- [x] Email/Password registration and login
- [x] Google OAuth integration (Emergent Auth)
- [x] JWT token management with httpOnly cookies
- [x] Rate limiting on auth endpoints
- [x] Role-based access control (user/admin)
- [x] Security hardening (generic error messages)

### Phase 3: Product Management (Completed)
- [x] Products API (CRUD operations)
- [x] Categories API
- [x] Product listing page with filters
- [x] Product detail page with image gallery
- [x] Stock management
- [x] Sales count tracking

### Phase 4: Customer Features (Completed)
- [x] Wishlist system (backend-driven)
- [x] Backend Cart system with full CRUD
- [x] Cart page with real-time updates
- [x] Header cart/wishlist count badges

### Phase 5: Checkout Flow (Completed - Feb 14, 2026)
- [x] Checkout page with address form
- [x] Pincode validation API
- [x] GST calculation (public endpoint)
- [x] Shipping charge calculation
- [x] COD payment option
- [x] Razorpay integration (MOCKED)
- [x] Order creation API
- [x] Order success page
- [x] My Orders page with order history

### Phase 6: Reviews System (Completed)
- [x] Review submission API
- [x] Verified buyer badge
- [x] Product reviews display

---

## Pending Tasks 📋

### P0 - Critical
- [ ] Admin Dashboard UI (products, orders, settings management)

### P1 - Important
- [ ] Return/Replacement request flow
- [ ] Hero Banner management UI
- [ ] Popup management UI
- [ ] Order status email notifications

### P2 - Nice to Have
- [ ] Forgot Password feature
- [ ] Email verification for new registrations
- [ ] Search functionality
- [ ] Order tracking integration with courier APIs
- [ ] Product recommendations engine

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google/session` - Google OAuth callback

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/{id}` - Update product (admin)
- `DELETE /api/products/{id}` - Delete product (admin)

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/{product_id}/{size}` - Update quantity
- `DELETE /api/cart/remove/{product_id}/{size}` - Remove item
- `DELETE /api/cart/clear` - Clear cart
- `GET /api/cart/count` - Get cart item count

### Wishlist
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist/add/{product_id}` - Add to wishlist
- `DELETE /api/wishlist/remove/{product_id}` - Remove from wishlist

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/{id}` - Get order details
- `POST /api/orders/create-razorpay-order` - Create Razorpay order
- `POST /api/orders/verify-payment` - Verify Razorpay payment

### Public
- `POST /api/public/check-pincode` - Check delivery availability
- `GET /api/admin/public/gst` - Get GST percentage
- `GET /api/admin/public/banners` - Get active banners
- `GET /api/admin/public/popup` - Get active popup

### Admin
- `GET /api/admin/pincodes` - List pincodes
- `POST /api/admin/pincodes` - Add pincode
- `PUT /api/admin/gst` - Update GST percentage
- `GET /api/orders/admin/all` - Get all orders
- `PUT /api/orders/admin/{id}/status` - Update order status
- `PUT /api/orders/admin/{id}/tracking` - Add tracking info

---

## Database Collections

- `users` - User accounts and profiles
- `products` - Product catalog
- `categories` - Product categories
- `carts` - User shopping carts
- `orders` - Customer orders
- `reviews` - Product reviews
- `pincodes` - Serviceable pincodes
- `gst_settings` - GST configuration
- `hero_banners` - Homepage banners
- `popups` - Promotional popups

---

## Test Credentials
- **Email**: test@example.com
- **Password**: password123
- **Test Pincode**: 110001

---

## Mocked Integrations
- **Razorpay**: Payment gateway is mocked. Creates mock order IDs (order_mock_*) and skips actual payment verification.

---

## File Structure
```
/app
├── backend/
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── product_routes.py
│   │   ├── cart_routes.py
│   │   ├── order_routes.py
│   │   ├── admin_routes.py
│   │   └── ...
│   ├── models.py
│   ├── server.py
│   └── auth.py
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ProductsPage.jsx
│   │   │   ├── ProductDetailPage.jsx
│   │   │   ├── CartPage.jsx
│   │   │   ├── CheckoutPage.jsx
│   │   │   ├── OrderSuccessPage.jsx
│   │   │   ├── MyOrdersPage.jsx
│   │   │   └── admin/
│   │   ├── components/
│   │   ├── services/api.js
│   │   └── context/AuthContext.jsx
│   └── .env
└── memory/PRD.md
```
