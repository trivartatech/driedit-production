# DRIEDIT.IN - Gen-Z Fashion E-commerce Platform

## Product Overview
A complete, production-ready, minimalistic Gen-Z fashion e-commerce platform for a streetwear brand.

## Design System
- **Style**: Minimal, bold typography, Black & white UI with Red accent (#E10600)
- **Approach**: Mobile-first, Gen-Z focused

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn UI, Framer Motion, Recharts
- **Backend**: FastAPI, Motor (async MongoDB driver)
- **Database**: MongoDB
- **Payments**: Razorpay (test mode)
- **Email**: Resend (verified domain: driedit.in)
- **Auth**: JWT + Official Google OAuth 2.0 (Backend-controlled flow)

---

## Authentication System ✅

### Email/Password Auth
- [x] Registration with bcrypt hashing
- [x] Login with JWT sessions
- [x] Forgot Password flow
- [x] Password Reset

### Google OAuth 2.0 ✅
- [x] Backend-controlled OAuth flow (more secure)
- [x] `/api/auth/google/login` - Initiates OAuth flow
- [x] `/api/auth/google/callback` - Handles callback, creates session
- [x] `/api/auth/google/status` - Check if configured
- [x] CSRF protection with state parameter
- [x] Account linking by email
- [x] Error handling with user-friendly messages

---

## Implemented Features ✅

### Customer Features
- [x] Product browsing with categories
- [x] Product detail pages with size selection
- [x] Wishlist system (database backed)
- [x] Shopping cart management
- [x] Complete checkout flow
- [x] Order history ("My Orders" page)
- [x] Order tracking
- [x] Replace & Return system
- [x] User Reviews (verified buyers only)
- [x] **Product Recommendations** - "You May Also Like" section on product pages
- [x] **Share Product** - Social sharing buttons (WhatsApp, Facebook, Instagram, Copy URL) with clipboard fallback

### User Profile & Address Manager (NEW) ✅
- [x] Profile page with tabbed layout (Profile Info, Saved Addresses)
- [x] Profile update (name, phone)
- [x] Phone validation (10-digit Indian mobile format, starts with 6-9)
- [x] Multiple saved addresses (max 5 per user)
- [x] Address CRUD (add, edit, delete)
- [x] Default address selection
- [x] Address labels (Home, Work, Other)
- [x] Checkout integration with address selector dropdown
- [x] Auto-select default address at checkout
- [x] Pincode auto-check when selecting saved address
- [x] Save address from checkout option
- [x] "Manage Addresses" link in checkout

### Pricing Engine
- [x] Dual pricing (regular + discounted)
- [x] GST calculation (18%)
- [x] Tier-based shipping system (admin configurable)
- [x] Hybrid coupon engine (manual + auto-apply best discount)

### Payment & Logistics
- [x] Razorpay integration (test mode)
- [x] Cash on Delivery (COD)
- [x] Tier-based shipping fees
- [x] **Universal Pincode Serviceability** ✅ NEW
  - All pincodes serviceable by default
  - Free shipping by default
  - COD available by default
  - Database entries act as OVERRIDES only (to charge shipping or disable COD for specific areas)
  - Reduces checkout friction and increases conversion

### Admin Panel
- [x] Dashboard overview
- [x] Analytics Dashboard (Revenue, AOV, Top Products, Coupons, Conversion, Customers)
- [x] **GST & Financial Reporting Module** (India-compliant) with CSV export
  - GST Summary Reports (date-filtered)
  - Sales Reports
  - Payment Reports
- [x] **Customer Management Module** ✅ NEW
  - Paginated customer list with search (name/email/phone)
  - Filters: date range, status (active/inactive)
  - Customer detail page: profile, addresses, orders, returns, financial summary
  - Activate/Deactivate customer toggle
  - CSV & Excel export with date filters
  - MongoDB aggregation pipelines for performance
- [x] Product CRUD with image uploads
- [x] **Dynamic Size Management**
  - Admin CRUD for sizes
  - Pre-seeded sizes: XS, S, M, L, XL, XXL, 28, 30, 32, 34, 36, 38
  - Grouped by category type (clothing, bottomwear)
  - Soft-delete protection if used in products
- [x] **Size Chart PDF per Product**
  - PDF upload per product
  - "View Size Chart" button on product page (opens in new tab)
- [x] **Banner & Popup Image Upload**
  - Server-side file storage instead of URL only
  - Secure MIME validation
  - Preview thumbnails in admin
- [x] Category management
- [x] Order management
- [x] Return management
- [x] Coupon management
- [x] Shipping tier management

### Email Notifications (Resend) ✅
- [x] Password reset emails
- [x] Order confirmation
- [x] Shipping notifications
- [x] Delivery notifications
- [x] Return status updates

### Production Security ✅
- [x] HTTPS enforcement
- [x] Secure cookies
- [x] Security headers (HSTS, etc.)
- [x] Rate limiting
- [x] Log rotation
- [x] Backup scripts

---

## API Endpoints

### User Profile & Addresses
- `GET /api/user/profile` - Get user profile with addresses
- `PUT /api/user/profile` - Update profile (name, phone)
- `GET /api/user/addresses` - Get all addresses
- `POST /api/user/addresses` - Add new address
- `PUT /api/user/addresses/{id}` - Update address
- `DELETE /api/user/addresses/{id}` - Delete address
- `PUT /api/user/addresses/{id}/set-default` - Set as default

### Size Management (Admin)
- `GET /api/admin/sizes` - Get all sizes (admin, with include_inactive param)
- `GET /api/admin/sizes/active` - Get active sizes (public)
- `POST /api/admin/sizes` - Create new size
- `PUT /api/admin/sizes/{id}` - Update size
- `DELETE /api/admin/sizes/{id}` - Delete size (fails if used in products)
- `PUT /api/admin/sizes/{id}/toggle` - Toggle active status
- `POST /api/admin/sizes/seed` - Seed default sizes

### Uploads
- `POST /api/uploads/product-image` - Upload product image
- `POST /api/uploads/banner-image` - Upload banner image
- `POST /api/uploads/popup-image` - Upload popup image
- `POST /api/uploads/size-chart` - Upload size chart PDF
- `GET /api/uploads/images/{filename}` - Serve product image
- `GET /api/uploads/banners/{filename}` - Serve banner image
- `GET /api/uploads/popups/{filename}` - Serve popup image
- `GET /api/uploads/size-charts/{filename}` - Serve size chart PDF

### Product Recommendations
- `GET /api/products/{product_id}/recommendations` - Get 4 recommended products
  - Strategy: Same category products (sorted by sales_count) + Best sellers from other categories
  - Excludes current product and out-of-stock items

### Customer Management (Admin) ✅ NEW
- `GET /api/admin/customers` - Paginated customer list with search & filters
  - Query params: page, per_page, search, from_date, to_date, status
- `GET /api/admin/customers/{id}` - Customer detail (profile, orders, returns, financial summary)
- `PUT /api/admin/customers/{id}/status` - Activate/deactivate customer
- `GET /api/admin/customers/export/csv` - Export customers to CSV
- `GET /api/admin/customers/export/excel` - Export customers to Excel

---

## Test Credentials

**Admin User:**
- Email: admin@driedit.in
- Password: adminpassword

**Regular User:**
- Email: test@example.com
- Password: password123

---

## Files Changed for Admin Enhancements Feature

### New Files
- `backend/routes/sizes_routes.py` - Size CRUD endpoints
- `frontend/src/pages/admin/AdminSizes.jsx` - Size management UI
- `backend/tests/test_admin_enhancements.py` - Test suite

### Modified Files
- `backend/models.py` - Added Size, SizeCreate, SizeUpdate models; Added size_chart_pdf to Product
- `backend/routes/upload_routes.py` - Added banner, popup, size-chart upload endpoints
- `backend/server.py` - Added sizes_routes router
- `frontend/src/services/api.js` - Added sizesAPI, banner/popup/size-chart upload methods
- `frontend/src/pages/admin/AdminLayout.jsx` - Added Sizes menu item
- `frontend/src/pages/admin/AdminProducts.jsx` - Dynamic sizes + size chart PDF upload
- `frontend/src/pages/admin/AdminBanners.jsx` - File upload instead of URL only
- `frontend/src/pages/admin/AdminPopups.jsx` - File upload instead of URL only
- `frontend/src/pages/ProductDetailPage.jsx` - "View Size Chart" button

### Content Pages ✅
- [x] About Us page
- [x] Privacy Policy page
- [x] Terms & Conditions page
- [x] Return & Refund Policy page

### UI/UX Enhancements ✅
- [x] Scroll-to-top on navigation
- [x] Clickable banner images (Hero section)
- [x] Redesigned "Shop by Category" section
- [x] Updated wishlist icon (outline style)
- [x] Mobile menu font size improvements
- [x] Simplified header navigation

---

## Upcoming Tasks

### P0 - Immediate
- [x] Universal Pincode Serviceability ✅ COMPLETED
- [ ] Production Deployment Checklist execution

### P1 - High Priority
- [x] Email verification on user signup (OTP-based) ✅

### P2 - Medium Priority  
- [ ] SMS notifications for order updates
- [ ] Inventory low-stock alerts

### P3 - Low Priority
- [ ] Advanced analytics filters
- [ ] Customer segmentation

---

*Last Updated: 2026-02-15*
*User Profile & Address Manager: ✅ Complete*
*Admin Enhancements (Sizes, Uploads, Size Chart): ✅ Complete*
*Product Recommendations: ✅ Complete*
*GST & Financial Reporting: ✅ Complete*
*Share Product Feature: ✅ Fixed - Uses clipboard fallback for browser compatibility*
*Content Pages (About, Legal): ✅ Complete*
*Customer Management Module: ✅ Complete - Admin can manage customers with full CRUD, filters, and export*
*Email Verification (OTP): ✅ Complete - 6-digit OTP sent via email, 10min expiry, rate limited*
*Universal Pincode Serviceability: ✅ Complete - All pincodes serviceable by default, overrides for exceptions*
