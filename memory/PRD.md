# DRIEDIT.IN - Gen-Z Fashion E-commerce Platform

## Product Overview
A complete, production-ready, minimalistic Gen-Z fashion e-commerce platform for a streetwear brand.

## Design System
- **Style**: Minimal, bold typography, Black & white UI with Red accent (#E10600)
- **Approach**: Mobile-first, Gen-Z focused

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend**: FastAPI, Motor (async MongoDB driver)
- **Database**: MongoDB
- **Payments**: Razorpay (test mode)
- **Email**: Resend (verified domain: driedit.in)
- **Auth**: JWT + Google OAuth via Emergent

---

## Implemented Features ✅

### Authentication & Authorization
- [x] Email/Password registration with bcrypt hashing
- [x] JWT-based session management (httpOnly cookies)
- [x] Google OAuth 2.0 via Emergent
- [x] Role-based access control (user, admin)
- [x] Forgot Password flow with secure token generation
- [x] Password Reset functionality

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

### Pricing Engine
- [x] Dual pricing (regular + discounted)
- [x] GST calculation (18%)
- [x] Tier-based shipping system (admin configurable)
- [x] Hybrid coupon engine (manual + auto-apply best discount)
- [x] Pricing order: Subtotal → Discount → GST → Shipping → Total

### Payment & Logistics
- [x] Razorpay integration (test mode)
- [x] Cash on Delivery (COD)
- [x] Tier-based shipping fees

### Admin Panel
- [x] Dashboard overview
- [x] Product CRUD with image uploads
- [x] Category management
- [x] Order management
- [x] Return management
- [x] Coupon management (with auto-apply toggle)
- [x] Shipping tier management
- [x] User management

### Email Notifications (Resend)
- [x] Password reset emails ✅ TESTED 2026-02-14
- [x] Order confirmation template ready
- [x] Shipping notification template ready
- [x] Delivery notification template ready
- [x] Return status templates ready

---

## Upcoming Tasks (P1-P2)

### P1 - Analytics Dashboard
- Revenue metrics (daily/weekly/monthly)
- Average Order Value (AOV)
- Conversion rates
- Top selling products
- Customer acquisition trends

### P2 - Production Deployment
- Environment variable audit
- Security hardening
- Performance optimization
- SSL/domain configuration
- Razorpay production keys

---

## Future Backlog (P2-P3)

- Email verification on signup
- SMS notifications (Twilio/MSG91)
- Inventory alerts
- Advanced analytics
- Marketing campaign integration

---

## Test Credentials

**Admin User:**
- Email: admin@driedit.in
- Password: adminpassword

**Regular User:**
- Email: test@example.com
- Password: password123

---

## Key API Endpoints

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/forgot-password`
- POST `/api/auth/reset-password`

### Products & Cart
- GET `/api/products`
- GET `/api/products/{id}`
- POST `/api/cart/add`
- GET `/api/cart`

### Orders
- POST `/api/orders`
- GET `/api/orders/my-orders`
- GET `/api/orders/{id}`

### Admin
- All admin routes prefixed with `/api/admin/`
- Shipping tiers: `/api/shipping-tiers/`
- Coupons: `/api/coupons/`

---

## Architecture

```
/app
├── backend/
│   ├── server.py (FastAPI app)
│   ├── models.py (Pydantic models)
│   ├── auth.py (JWT utilities)
│   ├── routes/ (API routes)
│   └── services/
│       └── email_service.py (Resend integration)
└── frontend/
    └── src/
        ├── components/ (UI components)
        ├── pages/ (Route pages)
        ├── context/ (React context)
        └── services/api.js (API client)
```

---

*Last Updated: 2026-02-14*
*Email System: Verified Working*
