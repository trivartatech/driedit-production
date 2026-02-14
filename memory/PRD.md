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

### Google OAuth 2.0 (NEW) ✅
- [x] Backend-controlled OAuth flow (more secure)
- [x] `/api/auth/google/login` - Initiates OAuth flow
- [x] `/api/auth/google/callback` - Handles callback, creates session
- [x] `/api/auth/google/status` - Check if configured
- [x] CSRF protection with state parameter
- [x] Account linking by email
- [x] Error handling with user-friendly messages
- [x] Removed Emergent Auth dependency

### Configuration Required
```env
# backend/.env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://driedit.in/api/auth/google/callback
FRONTEND_URL=https://driedit.in
```

### Redirect URIs to Configure in Google Cloud Console
- Production: `https://driedit.in/api/auth/google/callback`
- Preview: `https://driedit-preview.preview.emergentagent.com/api/auth/google/callback`
- Local: `http://localhost:8000/api/auth/google/callback`

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

### Pricing Engine
- [x] Dual pricing (regular + discounted)
- [x] GST calculation (18%)
- [x] Tier-based shipping system (admin configurable)
- [x] Hybrid coupon engine (manual + auto-apply best discount)

### Payment & Logistics
- [x] Razorpay integration (test mode)
- [x] Cash on Delivery (COD)
- [x] Tier-based shipping fees

### Admin Panel
- [x] Dashboard overview
- [x] Analytics Dashboard (Revenue, AOV, Top Products, Coupons, Conversion, Customers)
- [x] Product CRUD with image uploads
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

## Test Credentials

**Admin User:**
- Email: admin@driedit.in
- Password: adminpassword

**Regular User:**
- Email: test@example.com
- Password: password123

---

## Files Changed for Google OAuth

### New Files
- `backend/routes/google_oauth_routes.py` - Complete OAuth flow implementation

### Modified Files
- `backend/server.py` - Added google_oauth_routes
- `backend/auth.py` - Removed Emergent exchange_session_id function
- `backend/routes/auth_routes.py` - Removed /session endpoint
- `backend/.env` - Added Google OAuth variables
- `frontend/src/pages/LoginPage.jsx` - Updated Google button to call backend
- `frontend/src/pages/HomePage.jsx` - Added OAuth success handling
- `frontend/src/App.js` - Removed AuthCallback

### Deleted Files
- `frontend/src/pages/AuthCallback.jsx` - No longer needed

---

*Last Updated: 2026-02-14*
*Google OAuth: ✅ Implemented (pending credentials)*
