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

### Phase 7: Admin Dashboard (Completed - Feb 14, 2026)
- [x] Admin-only route protection
- [x] Dashboard with stats overview (Revenue, Orders, Products, Low Stock)
- [x] **Orders Management**
  - [x] View all orders with search and filter
  - [x] Update order status (Pending → Confirmed → Shipped → Delivered)
  - [x] Add tracking ID and courier info
  - [x] View order details (items, customer info, pricing)
- [x] **Products Management**
  - [x] View products grid with stock indicators
  - [x] Add new products with images, sizes, pricing
  - [x] Edit/Delete products
  - [x] Low stock alerts
- [x] **Categories Management**
  - [x] View, Add, Edit, Delete categories
- [x] **Pincode & GST Management**
  - [x] View/Add/Edit/Delete serviceable pincodes
  - [x] Set shipping charges per pincode
  - [x] Toggle COD availability
  - [x] Update global GST percentage
- [x] **Hero Banner Management**
  - [x] View, Add, Edit, Delete banners
  - [x] Set image URL, button text, redirect URL
  - [x] Enable/Disable banners
  - [x] Set display order
- [x] **Popup Management**
  - [x] View, Add, Edit, Delete popups
  - [x] Set title, description, image, button
  - [x] Display type configuration
  - [x] Enable/Disable popups
- [x] **Returns Management**
  - [x] View all return requests
  - [x] Approve/Reject returns
  - [x] Add admin notes
  - [x] Filter by status

---

### Phase 8: Customer Return Request Flow (Completed - Feb 14, 2026)
- [x] Return eligibility check API (7-day window from delivery)
- [x] Return request creation API with validation
- [x] Per-item return selection
- [x] Return reason selection (7 options)
- [x] Optional comments field
- [x] Optional image upload (recommended for damaged/defective)
- [x] Duplicate return prevention
- [x] Return status badges on My Orders page
- [x] "Days remaining" indicator for return window
- [x] "Return request pending review" status display
- [x] Mobile-first Return Request Modal

### Phase 9: Product Image Upload (Completed - Feb 14, 2026)
- [x] Server-side image storage in `/uploads/products/`
- [x] Image upload API with validation (JPG, PNG, WebP, GIF)
- [x] Max 5MB per image, max 5 images per product
- [x] Unique filename generation (UUID-based)
- [x] Image preview grid in admin panel
- [x] Support for both file upload and URL input
- [x] Image deletion API
- [x] Static file serving with caching headers

---

## Pending Tasks 📋

### P1 - Important
- [ ] Order status email notifications

### P2 - Nice to Have
- [ ] Forgot Password feature
- [ ] Email verification for new registrations
- [ ] Search functionality with autocomplete
- [ ] Order tracking integration with courier APIs
- [ ] Product recommendations engine
- [ ] Analytics dashboard

---

## Test Credentials
- **Admin**: admin@driedit.in / adminpassword
- **User**: test@example.com / password123
- **Test Pincode**: 110001

---

## Mocked Integrations
- **Razorpay**: Payment gateway is in mock mode until real keys are configured.
  - To enable: Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `/app/backend/.env`
  - Add `REACT_APP_RAZORPAY_KEY_ID` to `/app/frontend/.env` (same key_id, safe for frontend)
  - Restart backend after adding keys
  - Check status: `GET /api/orders/payment-config`
  - Supports both Test (`rzp_test_*`) and Live (`rzp_live_*`) keys

---

## API Endpoints Summary

### Public
- `GET /api/admin/public/banners` - Active banners
- `GET /api/admin/public/gst` - GST percentage
- `POST /api/public/check-pincode` - Check delivery

### Auth
- `POST /api/auth/register`, `/api/auth/login`, `/api/auth/logout`
- `GET /api/auth/me`

### Products & Categories
- `GET/POST/PUT/DELETE /api/products`
- `GET/POST/PUT/DELETE /api/categories`

### Cart
- `GET/POST/PUT/DELETE /api/cart/*`

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - User's orders
- `GET /api/orders/payment-config` - Get payment gateway status (public)
- `POST /api/orders/create-razorpay-order` - Create Razorpay order
- `POST /api/orders/verify-payment` - Verify payment signature
- `GET /api/orders/admin/all` - All orders (Admin)
- `PUT /api/orders/admin/{id}/status` - Update status (Admin)
- `PUT /api/orders/admin/{id}/tracking` - Add tracking (Admin)

### Returns
- `GET /api/returns/check-eligibility/{order_id}` - Check return eligibility
- `POST /api/returns` - Submit return request
- `GET /api/returns/my-requests` - User's return requests
- `GET /api/returns/admin/all` - All returns (Admin)
- `PUT /api/returns/admin/{id}/status` - Update return status (Admin)

### Admin
- `GET/POST/PUT/DELETE /api/admin/pincodes`
- `GET/PUT /api/admin/gst`
- `GET/POST/PUT/DELETE /api/admin/banners`
- `GET/POST/PUT/DELETE /api/admin/popups`
- `GET/PUT /api/returns/admin/*`

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
│   │   ├── return_routes.py
│   │   └── public_routes.py
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
│   │   │       ├── AdminLayout.jsx
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminOrders.jsx
│   │   │       ├── AdminProducts.jsx
│   │   │       ├── AdminCategories.jsx
│   │   │       ├── AdminPincode.jsx
│   │   │       ├── AdminBanners.jsx
│   │   │       ├── AdminPopups.jsx
│   │   │       └── AdminReturns.jsx
│   │   ├── components/
│   │   │   └── ReturnRequestModal.jsx
│   │   ├── services/api.js
│   │   └── context/AuthContext.jsx
│   └── .env
└── memory/PRD.md
```

---

## Testing Results (Feb 14, 2026)
- **Backend Tests**: 42/42 passed (100%)
- **Frontend Tests**: All 8 admin pages + Return flow tested
- **Checkout Flow**: Fully tested
- **Return Request Flow**: Fully tested (15/15 tests passed)
- **Access Control**: Working (401 for unauth, 403 for non-admin)
