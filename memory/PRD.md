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

### Core E-commerce (Completed)
- Full authentication (Email/Password + Google OAuth)
- Product catalog with categories and filters
- Wishlist and cart systems
- Checkout flow with Razorpay (test mode) and COD
- Order management and tracking
- Admin dashboard with full CRUD operations
- Customer return request flow
- Product image upload
- User reviews system

### Email Notifications (Completed - PENDING API KEY)
- Resend integration for transactional emails
- **STATUS**: Code complete, awaiting RESEND_API_KEY + domain verification

### Tier-Based Shipping System (Completed - Feb 14, 2026)
- Replaced pincode-based shipping with tier-based system
- Shipping calculated on discounted subtotal
- Admin CRUD for shipping tiers
- **Default Tiers**: ₹0-499 = ₹80, ₹500-999 = ₹50, ₹1000+ = FREE

### Hybrid Coupon Engine (Completed - Feb 14, 2026)
**Enterprise-Level Pricing System:**

#### Auto-Apply Engine
- Fetch eligible auto-apply coupons
- Validate eligibility (min order, expiry, usage limits)
- Pick highest discount automatically
- Apply at checkout load

#### Manual Coupon Override
- User can enter private/influencer codes
- Manual always overrides auto
- Invalid manual reverts to auto

#### Priority Rules
| Scenario | Result |
|----------|--------|
| Auto coupon exists | Applied automatically |
| User enters manual | Manual overrides auto |
| Manual gives lower discount | Still override (user choice) |
| Manual invalid | Revert to auto coupon |

#### Final Pricing Order (Industry Standard)
```
1. Calculate base subtotal
2. Apply coupon discount
3. Calculate GST on discounted base
4. Calculate shipping (tier-based on discounted base)
5. Final total
```

**Note:** Shipping never discounted. No stacking allowed.

#### Admin Features
- Create coupon with auto_apply toggle
- AUTO badge with lightning icon on auto coupons
- Usage breakdown: auto/manual count
- Revenue generated per coupon

**Test Results:** 22/22 backend tests passed, 100% frontend verified

---

## Pending Tasks 📋

### P1 - High Priority
- [ ] Activate email notifications (add RESEND_API_KEY + verify domain)

### P2 - Nice to Have
- [ ] Email verification for new registrations
- [ ] Search with autocomplete
- [ ] Analytics dashboard

### P3 - Future
- [ ] SMS Notifications
- [ ] Production deployment checklist

---

## Test Credentials
- **Admin**: admin@driedit.in / adminpassword
- **User**: test@example.com / password123
- **Test Pincode**: 110001
- **Auto Coupon**: FESTIVE10 (10% off, min ₹500, max ₹200)

---

## Integration Status

| Integration | Status | Notes |
|-------------|--------|-------|
| Razorpay | ✅ TEST MODE | Working with test keys |
| Resend Email | ⚠️ PENDING | Code complete, needs API key + domain |
| Google OAuth | ✅ ACTIVE | Via Emergent Auth |

---

## Key API Endpoints

### Coupons (Enhanced)
- `GET /api/coupons/auto-apply?subtotal={amount}` - Get best auto-apply coupon
- `POST /api/coupons/validate` - Validate manual coupon
- `POST /api/coupons/admin/create` - Create coupon with auto_apply flag
- `GET /api/coupons/admin/all` - List with auto/manual usage stats
- `GET /api/coupons/admin/{id}` - Details with revenue breakdown

### Shipping Tiers
- `GET /api/shipping-tiers/calculate?subtotal={amount}` - Calculate shipping
- `GET /api/shipping-tiers/admin/all` - Admin management

### Orders
- `POST /api/orders` - Create order (uses correct pricing order)

---

## File Structure
```
/app
├── backend/
│   ├── routes/
│   │   ├── coupon_routes.py  # Enhanced with auto-apply
│   │   ├── shipping_tier_routes.py
│   │   ├── order_routes.py  # Updated pricing order
│   │   └── ...
│   ├── models.py  # Coupon with auto_apply field
│   └── server.py
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CheckoutPage.jsx  # Auto-apply + pricing display
│   │   │   ├── admin/
│   │   │   │   ├── AdminCoupons.jsx  # Auto toggle + stats
│   │   │   │   └── AdminShippingTiers.jsx
│   │   │   └── ...
│   │   └── services/api.js  # getAutoCoupon endpoint
│   └── .env
└── memory/PRD.md
```

---

## Checkout Display Example

```
Subtotal:                  ₹2,000
Auto Coupon (FESTIVE10):   -₹200
GST (18%) (on discounted):  ₹324
Shipping:                   FREE
─────────────────────────────────
Total:                    ₹2,124
```

If user enters manual code:
```
Manual Coupon (INFLUENCER50): -₹50
```
Auto coupon disappears.

---

## Testing Results (Feb 14, 2026)
- **Hybrid Coupon System**: 22/22 backend tests passed, 100% frontend
- **Shipping Tiers**: 22/23 passed
- **Previous Tests**: All passed

---

## Last Updated
**Date**: February 14, 2026
**Session**: Implemented hybrid coupon engine with auto-apply functionality
