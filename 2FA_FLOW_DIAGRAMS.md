# 2FA Authentication Flow Diagrams

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     HARU DIGITAL WARDROBE                           │
│                   2-Step Email OTP System                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ RoleSelector.js                                              │   │
│  │ - Customer / Stylist / Admin roles                           │   │
│  └──────────────┬─────────────────────────────────────────────┬┘   │
│                 │ Customer                          Stylist/Admin   │
│                 ▼                                         │          │
│  ┌──────────────────────────────────┐    ┌──────────────▼──────┐  │
│  │ CustomerLogin.js                 │    │ StylistLogin.js     │  │
│  │ + 2-Step Verification            │    │ AdminLogin.js       │  │
│  │                                  │    │                     │  │
│  │ Step 1: Email + Password ────────┼──→ │ Email + Password    │  │
│  │ ↓                                │    │ ↓                   │  │
│  │ Step 2: OTP Verification        │    │ ✓ Login             │  │
│  │ (6-digit code from email)       │    │                     │  │
│  │ ↓                                │    └────────┬────────────┘  │
│  │ ✓ Login                          │            │                 │
│  └──────────────┬────────────────────┘            │                 │
│                 │                                  │                 │
│  ┌──────────────▼──────────────────────────────────▼─────────────┐ │
│  │               Dashboard Component                              │ │
│  │ CustomerDashboard / StylistDashboard / AdminDashboard          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Auth Context: Stores token, user info, login/logout functions      │
└──────────────────────────────────────────────────────────────────────┘
                            ▲
                            │ HTTP (Axios)
                            │ Authorization: Bearer <token>
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node/Express)                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Routes: /api/auth/                                          │  │
│  │                                                             │  │
│  │ POST /signup - Create new customer                         │  │
│  │ POST /login - Validate credentials, send OTP (customers)  │  │
│  │ POST /verify-otp - Verify OTP code                        │  │
│  │ POST /resend-otp - Send new OTP                           │  │
│  │ GET /me - Get current user (protected)                    │  │
│  └─────────┬───────────────────────────────────────────────────┘  │
│            │                                                       │
│  ┌─────────▼───────────────────────────────────────────────────┐  │
│  │ Services: emailService.js                                   │  │
│  │                                                             │  │
│  │ generateOTP() - Create 6-digit code                        │  │
│  │ sendOTPEmail() - Send via nodemailer                       │  │
│  │                                                             │  │
│  │ Uses: Gmail SMTP (configurable)                            │  │
│  └─────────┬───────────────────────────────────────────────────┘  │
│            │                                                       │
│            ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Models: Database Schemas                                    │  │
│  │                                                             │  │
│  │ User - username, email, password (hashed), role             │  │
│  │ OTP - userId, email, otp, isUsed, createdAt (TTL 10min)   │  │
│  │ Outfit - userId, name, notes, dates                        │  │
│  └─────────┬───────────────────────────────────────────────────┘  │
│            │                                                       │
│            ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ MongoDB (localhost:27017)                                   │  │
│  │                                                             │  │
│  │ Collections: users, otps, outfits                           │  │
│  │ TTL Index: OTP auto-deletes after 600 seconds (10 min)     │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Email Service: nodemailer                                           │
│  ├── SMTP Service: Gmail                                             │
│  ├── Credentials: EMAIL_USER, EMAIL_PASSWORD (.env)                 │
│  └── Template: HTML formatted OTP email                              │
└──────────────────────────────────────────────────────────────────────┘
```

## Customer 2FA Login Flow (Detailed)

```
START
  │
  ├─────────────────────────────────┐
  │                                  │
  ▼                                  ▼
┌────────────────────────┐    ┌─────────────────────┐
│  Existing Customer     │    │  New Customer       │
│  (Login)               │    │  (Sign Up)          │
└────────────┬───────────┘    └──────────┬──────────┘
             │                          │
             │ Email + Password         │ Fill all fields
             │                          │
             ▼                          ▼
        ┌─────────────────────────────────────┐
        │ POST /api/auth/login (or /signup)   │
        │ Backend Validation                  │
        └──────────────┬──────────────────────┘
                       │
                       ├─ Invalid credentials?
                       │  └─→ Error message, stay on login
                       │
                       ├─ Invalid data format?
                       │  └─→ Validation error
                       │
                       ✓ Valid credentials
                       │
                       ▼
        ┌─────────────────────────────────────┐
        │ Generate 6-digit OTP                │
        │ Generate temp JWT (10 min expiry)   │
        │ Save OTP to database                │
        │ Send OTP email via SMTP             │
        └──────────────┬──────────────────────┘
                       │
                       ✓ Email sent successfully
                       │
                       ▼
        ┌─────────────────────────────────────┐
        │ Response to Frontend:                │
        │ {                                   │
        │   requiresOTP: true,                │
        │   tempToken: "...",                 │
        │   email: "customer@example.com"     │
        │ }                                   │
        └──────────────┬──────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────────────┐
        │ Frontend: Switch to OTP screen      │
        │ Show: "OTP sent to your email"      │
        │ Input: 6-digit OTP field            │
        │ Button: Verify OTP / Resend OTP    │
        └──────────────┬──────────────────────┘
                       │
                       ├─────────────┬────────────────┐
                       │             │                │
                ✓ User enters  Back button      Resend
                  OTP            │               │
                       │         ▼               ▼
                       │    ┌─────────────┐  ┌──────────────────┐
                       │    │ Back to     │  │ POST /resend-otp │
                       │    │ login       │  │ Delete old OTP   │
                       │    └─────────────┘  │ Generate new OTP │
                       │                     │ Send new email   │
                       │                     └──────┬───────────┘
                       │                            │
                       │                            ▼
                       │                     ┌─────────────────┐
                       │                     │ Back to OTP     │
                       │                     │ input screen    │
                       │                     └─────────────────┘
                       │
                       ▼
        ┌─────────────────────────────────────┐
        │ POST /api/auth/verify-otp           │
        │ {                                   │
        │   otp: "123456",                    │
        │   tempToken: "..."                  │
        │ }                                   │
        └──────────────┬──────────────────────┘
                       │
                       ├─ Invalid temp token?
                       │  └─→ "Token expired. Please login again"
                       │      └─→ Back to login screen
                       │
                       ├─ OTP not found / already used?
                       │  └─→ "Invalid or expired OTP"
                       │      └─→ Show resend option
                       │
                       ├─ OTP expired?
                       │  └─→ "OTP expired (10 min)"
                       │      └─→ Show resend option
                       │
                       ✓ OTP valid & unused
                       │
                       ▼
        ┌─────────────────────────────────────┐
        │ Mark OTP as used (isUsed: true)     │
        │ Generate JWT token (7 day expiry)   │
        │ Fetch user data                     │
        └──────────────┬──────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────────────┐
        │ Response to Frontend:                │
        │ {                                   │
        │   token: "jwt...",                  │
        │   user: {                           │
        │     id, username, email, role...    │
        │   }                                 │
        │ }                                   │
        └──────────────┬──────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────────────┐
        │ Frontend:                            │
        │ - Store token in localStorage       │
        │ - Store user info in localStorage   │
        │ - Update AuthContext                │
        │ - Redirect to /customer-dashboard   │
        └──────────────┬──────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────────────┐
        │ Dashboard                            │
        │ - Show customer options              │
        │ - Can access protected routes        │
        │ - Token sent in Authorization header │
        │   for all API requests               │
        └─────────────────────────────────────┘
                       │
                       ▼
                      END
```

## Stylist/Admin Login Flow (Direct - No OTP)

```
START
  │
  ▼
┌────────────────────────────┐
│ Select Role                │
│ (Stylist or Admin)         │
└────────────────┬───────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ Email + Password    │
        │ Form                │
        └──────────┬──────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ POST /api/auth/login     │
        │ Backend Validation       │
        └─────────┬────────────────┘
                  │
                  ├─ Invalid?
                  │  └─→ Error, stay on form
                  │
                  ✓ Valid
                  │
                  ├─ role === 'customer'?
                  │  └─→ "Wrong login page for your role"
                  │
                  ✓ role === 'stylist' or 'admin'
                  │
                  ▼
        ┌──────────────────────────┐
        │ Generate JWT token       │
        │ (7 day expiry)           │
        │ Return: { token, user }  │
        └─────────┬────────────────┘
                  │
                  ▼
        ┌──────────────────────────┐
        │ Frontend:                │
        │ - Save token             │
        │ - Save user              │
        │ - Redirect to dashboard  │
        └─────────┬────────────────┘
                  │
                  ▼
        ┌──────────────────────────┐
        │ Dashboard                │
        │ (Role-based features)    │
        └──────────────────────────┘
                  │
                  ▼
                 END
```

## OTP Data Lifecycle

```
┌────────────────────────────────────────────────────┐
│            OTP Lifecycle (10 minutes)              │
└────────────────────────────────────────────────────┘

Creation:
  ├─ POST /api/auth/login
  ├─ generateOTP() creates "123456"
  ├─ new OTP({ userId, email, otp, isUsed: false, createdAt: now })
  └─ otpRecord.save()

Storage:
  ├─ MongoDB collection: otps
  ├─ Document:
  │  {
  │    _id: ObjectId,
  │    userId: ObjectId,
  │    email: "customer@example.com",
  │    otp: "123456",
  │    isUsed: false,
  │    createdAt: 2024-01-15T10:00:00Z
  │  }
  └─ TTL Index: expires in 600 seconds

Usage:
  ├─ POST /api/auth/verify-otp
  ├─ User enters "123456"
  ├─ Query: OTP.findOne({ userId, otp, isUsed: false })
  ├─ If found: otpRecord.isUsed = true
  ├─ Save changes
  └─ Issue JWT token

Expiration (Automatic):
  ├─ MongoDB TTL runs every 60 seconds
  ├─ At 10 minutes (600 sec after creation):
  ├─ Document is automatically deleted
  ├─ User sees "OTP expired" if they verify after
  └─ Must use "Resend OTP" to get new code

Cleanup:
  ├─ MongoDB indexes handle automatic cleanup
  ├─ Unused OTPs deleted after 10 min
  ├─ Used OTPs marked and eventually deleted
  └─ Database stays clean automatically
```

## Security Timeline

```
Minute 0: OTP Created & Sent
  ├─ OTP generated: "123456"
  ├─ Temp JWT token: valid for 10 min
  ├─ Email sent to customer
  └─ Frontend shows OTP input screen

Minute 0-10: OTP Valid
  ├─ User can enter OTP
  ├─ Verification succeeds
  ├─ JWT token issued
  ├─ User logged in
  └─ Old OTP marked as used

Minute 10: First OTP Expires
  ├─ MongoDB deletes unused OTP records
  ├─ Temp JWT token also expires
  ├─ User cannot verify old OTP
  ├─ Must request new OTP
  └─ Frontend shows "OTP expired" error

After Minute 10: Resend OTP
  ├─ User clicks "Resend OTP"
  ├─ New OTP generated: "654321"
  ├─ New temp JWT token: valid 10 min
  ├─ New email sent
  ├─ Old OTP deleted (if unused)
  └─ User enters new OTP to verify
```

## Token Validity Diagram

```
┌─────────────────────────────────────────────────────────┐
│ JWT Token Types & Expiration                            │
└─────────────────────────────────────────────────────────┘

Temporary Token (OTP Verification)
├─ Issued: After email/password validation
├─ Type: { id, type: 'otp' }
├─ Expiry: 10 minutes (600 seconds)
├─ Purpose: Used to verify OTP code
├─ Can be used: For /verify-otp and /resend-otp only
└─ Example:
   POST /api/auth/verify-otp
   { otp: "123456", tempToken: "eyJ0eXAiOiJKV1QiLCJhbGc..." }

JWT Token (Main Authentication)
├─ Issued: After OTP verification succeeds
├─ Type: { id, type: undefined }
├─ Expiry: 7 days
├─ Purpose: Access protected routes
├─ Used in: Authorization: Bearer <token>
└─ Example:
   GET /api/auth/me
   Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...

Timeline:
├─ T+0: Email/Password → Temp token issued (10 min TTL)
├─ T+5 min: User enters OTP → JWT token issued (7 day TTL)
├─ T+10 min: Temp token expires (can't resend OTP)
├─ T+7 days: JWT token expires (must login again)
└─ If user waits > 10 min before OTP entry:
   └─ Temp token expires → Must restart login
```

## Error State Transitions

```
┌────────────────────────────────────────────────┐
│ Frontend Error Handling & State Recovery        │
└────────────────────────────────────────────────┘

Invalid Credentials
├─ Backend: 400 "Invalid email or password"
├─ Frontend: Show error, stay on login form
└─ Recovery: Try again with correct credentials

Email Not Found
├─ Backend: 400 "Invalid email or password"
├─ Frontend: Show error
└─ Recovery: Create account or check email

OTP Expired (10+ min passed)
├─ Backend: 400 "Invalid or expired OTP"
├─ Frontend: Show error with "Resend OTP" button
└─ Recovery: Click "Resend OTP" to get new code

Invalid OTP (Wrong digits)
├─ Backend: 400 "Invalid or expired OTP"
├─ Frontend: Show error, keep OTP form visible
└─ Recovery: Check email again and re-enter

Temp Token Expired (waited > 10 min)
├─ Backend: 400 "Token expired. Please login again."
├─ Frontend: Show error with "Back to Login" button
└─ Recovery: Click button to restart login

Network Error
├─ Frontend: Catch error, show "Please try again"
├─ No data sent to backend
└─ Recovery: Retry the same request

Missing Email Config
├─ Backend: 500 "Failed to send OTP"
├─ Frontend: Show error message
└─ Recovery: Admin must configure EMAIL variables in .env
```

---

This system provides secure, user-friendly 2FA authentication with proper error handling and recovery flows.
