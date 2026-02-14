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

### Phase 1-7: Core E-commerce (Completed)
- Full authentication (Email/Password + Google OAuth)
- Product catalog with categories and filters
- Wishlist and cart systems
- Checkout flow with Razorpay (test mode) and COD
- Order management and tracking
- Admin dashboard with full CRUD operations
- Customer return request flow

### Phase 8: Product Image Upload (Completed)
- Server-side image storage
- Admin image upload UI
- Max 5MB per image, max 5 images per product

### Phase 9: Email Notifications (Completed - PENDING API KEY)
- Resend integration for transactional emails
- Order confirmation, shipping, delivery notifications
- **STATUS**: Code complete, awaiting RESEND_API_KEY

### Phase 10: Discount Coupon System (Completed)
- Percentage and Fixed amount coupons
- Min order value, max discount, usage limits
- Admin management with usage statistics
- Checkout integration
- **Tested**: 23/23 tests passed

### Phase 11: Forgot Password Flow (Completed)
- Secure token-based reset
- 1-hour expiry
- Email enumeration protection
- **Tested**: All tests passed

### Phase 12: User Reviews System (Completed)
- Star rating (1-5)
- Verified buyer badge
- One review per user per product

### Phase 13: Tier-Based Shipping System (Completed - Feb 14, 2026)
- **NEW**: Replaced pincode-based shipping with tier-based system
- Shipping calculated on **subtotal BEFORE GST**
- Admin CRUD for shipping tiers
- Overlap validation to prevent conflicting ranges
- **Default Tiers**:
  - ₹0 - ₹499: ₹80 shipping
  - ₹500 - ₹999: ₹50 shipping
  - ₹1,000+: FREE shipping
- **Tested**: 22/23 backend tests passed

---

## Pending Tasks 📋

### P1 - High Priority
- [ ] Activate email notifications (add RESEND_API_KEY)
- [ ] Verify Resend domain for production emails

### P2 - Nice to Have
- [ ] Email verification for new registrations
- [ ] Search with autocomplete
- [ ] Order tracking with courier APIs
- [ ] Product recommendations engine
- [ ] Analytics dashboard

### P3 - Future
- [ ] SMS Notifications
- [ ] Production deployment checklist

---

## Test Credentials
- **Admin**: admin@driedit.in / adminpassword
- **User**: test@example.com / password123
- **Test Pincode**: 110001

---

## Integration Status

| Integration | Status | Notes |
|-------------|--------|-------|
| Razorpay | ✅ TEST MODE | Working with test keys |
| Resend Email | ⚠️ PENDING | Code complete, needs API key |
| Google OAuth | ✅ ACTIVE | Via Emergent Auth |

---

## Key API Endpoints

### Shipping Tiers (NEW)
- `GET /api/shipping-tiers/calculate?subtotal={amount}` - Calculate shipping
- `GET /api/shipping-tiers/all-active` - Get active tiers (public)
- `GET /api/shipping-tiers/admin/all` - Get all tiers (admin)
- `POST /api/shipping-tiers/admin/create` - Create tier (admin)
- `PUT /api/shipping-tiers/admin/{id}` - Update tier (admin)
- `DELETE /api/shipping-tiers/admin/{id}` - Delete tier (admin)
- `PUT /api/shipping-tiers/admin/{id}/toggle` - Toggle status (admin)

### Auth
- `POST /api/auth/register`, `/api/auth/login`, `/api/auth/logout`
- `POST /api/auth/forgot-password`, `/api/auth/reset-password`

### Products & Categories
- `GET/POST/PUT/DELETE /api/products`
- `GET/POST/PUT/DELETE /api/categories`

### Orders
- `POST /api/orders` - Create order (uses tier-based shipping)
- `GET /api/orders` - User's orders
- Admin order management endpoints

### Coupons
- `POST /api/coupons/validate` - Validate coupon
- Admin coupon CRUD endpoints

---

## File Structure
```
/app
├── backend/
│   ├── routes/
│   │   ├── shipping_tier_routes.py  # NEW
│   │   ├── coupon_routes.py
│   │   ├── password_reset_routes.py
│   │   ├── order_routes.py  # Updated for tier shipping
│   │   └── ... (other routes)
│   ├── services/
│   │   └── email_service.py
│   ├── models.py  # Added ShippingTier models
│   └── server.py
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminShippingTiers.jsx  # NEW
│   │   │   │   └── ...
│   │   │   ├── CheckoutPage.jsx  # Updated for tier shipping
│   │   │   └── ...
│   │   └── services/api.js  # Added shippingAPI
│   └── .env
└── memory/PRD.md
```

---

## Testing Results (Feb 14, 2026)
- **Shipping Tiers**: 22/23 backend tests passed (1 rate-limit issue during testing)
- **Coupon System**: 23/23 tests passed
- **Password Reset**: All tests passed
- **Admin UI**: All verified working

---

## Shipping Tier Logic

```
Order Subtotal (before GST) → Find matching tier → Apply shipping charge

Example:
- Subtotal: ₹1,000
- GST (5%): ₹50  
- Shipping (₹1000+ tier): ₹0 (FREE)
- Total: ₹1,050
```

The tier lookup uses:
```
min_amount <= subtotal <= max_amount (or no max for unlimited)
```

---

## Last Updated
**Date**: February 14, 2026
**Session**: Implemented tier-based shipping system with Admin UI
