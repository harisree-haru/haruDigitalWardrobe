# Haru Digital Wardrobe - Full Stack Authentication System

A secure personal styling and outfit planning system with separate user roles (Customers, Stylists, and Admins). Built with React, Node.js/Express, and MongoDB. Features 2-Step Email OTP authentication for customers.

## 🎯 Features

- **User Authentication**: Secure login and registration system
- **2-Step Email OTP**: Customers receive one-time passwords via email for secure login
- **Role-Based Access**: Separate dashboards for Customers, Stylists, and Admins
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Express-validator for data validation
- **Email Service**: nodemailer integration for OTP delivery
- **CORS Enabled**: Secure cross-origin requests
- **Responsive UI**: Mobile-friendly authentication pages with 2FA support

## 📋 Project Structure

```
haruDigitalWardrobe/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── models/
│   │   ├── User.js               # User schema and methods
│   │   ├── Outfit.js             # Outfit schema
│   │   └── OTP.js                # OTP schema with auto-expiration
│   ├── services/
│   │   └── emailService.js       # Nodemailer & OTP generation
│   ├── routes/
│   │   ├── auth.js               # Authentication routes (2FA)
│   │   ├── outfits.js            # Outfit CRUD operations
│   │   └── users.js              # Admin user management
│   ├── server.js                 # Express server
│   ├── seedUsers.js              # Database seeding script
│   ├── package.json
│   └── .env                       # Environment variables
│
└── frontend/
    ├── public/
    │   └── index.html            # HTML template
    ├── src/
    │   ├── components/
    │   │   └── PrivateRoute.js    # Protected route component
    │   ├── context/
    │   │   └── AuthContext.js     # Authentication context
    │   ├── pages/
    │   │   ├── RoleSelector.js    # Role selection landing page
    │   │   ├── CustomerLogin.js   # Customer login with 2FA
    │   │   ├── StylistLogin.js    # Stylist login
    │   │   ├── AdminLogin.js      # Admin login
    │   │   ├── CustomerDashboard.js
    │   │   ├── StylistDashboard.js
    │   │   ├── AdminDashboard.js
    │   │   ├── AddOutfit.js       # Create new outfit
    │   │   ├── ViewOutfits.js     # View user outfits
    │   │   └── ManageUsers.js     # Admin user management
    │   ├── styles/
    │   │   ├── Auth.css           # Authentication & 2FA styles
    │   │   ├── Dashboard.css      # Dashboard styles
    │   │   ├── Outfit.css         # Outfit management styles
    │   │   └── Admin.css          # Admin panel styles
    │   ├── App.js                 # Main app component with routing
    │   ├── index.js               # React entry point
    │   └── index.css              # Global styles
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (running locally on default port 27017)
- npm or yarn

### Installation

#### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Seed the database with sample users
npm run seed

# Start the development server
npm run dev
# or
npm start
```

The backend server will run on `http://localhost:5000`

#### 2. Frontend Setup

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server with npm dev script
npm run dev
```

The frontend will run on `http://localhost:3000`

#### 3. Configure Email Service for 2FA (Optional but Recommended)

To enable 2-Step Email OTP authentication, configure nodemailer in the backend `.env` file:

**For Gmail (Recommended):**

1. Enable 2-Step Verification on your Google Account at https://accounts.google.com/security
2. Create an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password

3. Update `.env` in the backend folder:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   OTP_EXPIRY=600
   ```

**For Other Email Services (Optional):**

You can configure any SMTP service by updating `.env`:
```
EMAIL_SERVICE=your-email-service
EMAIL_USER=your-email@service.com
EMAIL_PASSWORD=your-app-password
OTP_EXPIRY=600
```

**Important:** If EMAIL credentials are not configured, customers will not be able to login (they require OTP verification)

## 🔐 Demo Credentials

Once the database is seeded, you can use these credentials to test the application:

### Customer Account
- **Email**: customer@example.com
- **Password**: password123

### Stylist Account
- **Email**: stylist@example.com
- **Password**: password123

### Additional Test Accounts
- **Email**: fashion@example.com (Customer)
- **Email**: expert@example.com (Stylist)
- **Password**: password123 (for all accounts)

## 📚 API Endpoints

### Authentication Routes (`/api/auth`)

#### Sign Up (Customer Only)
```
POST /api/auth/signup
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "customer"
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer"
  }
}
```

#### Login (Step 1: Email & Password)
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response (For Customer - Requires OTP):
{
  "success": true,
  "requiresOTP": true,
  "tempToken": "temporary_jwt_token",
  "email": "john@example.com",
  "message": "OTP sent to your email. Please verify to complete login."
}

Response (For Stylist/Admin - Direct Login):
{
  "success": true,
  "requiresOTP": false,
  "token": "jwt_token_here",
  "user": {...}
}
```

#### Verify OTP (Step 2: Customer 2FA)
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "otp": "123456",
  "tempToken": "temporary_jwt_token"
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer"
  }
}
```

#### Resend OTP
```
POST /api/auth/resend-otp
Content-Type: application/json

{
  "tempToken": "temporary_jwt_token"
}

Response:
{
  "success": true,
  "message": "OTP resent to your email"
}
```

#### Get Current User (Protected)
```
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "user": {...}
}
```

### Outfit Routes (`/api/outfits`)

#### Get User's Outfits (Protected)
```
GET /api/outfits
Authorization: Bearer <token>
```

#### Create Outfit (Protected)
```
POST /api/outfits
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Summer Casual",
  "notes": "Perfect for beach outings"
}
```

#### Update Outfit (Protected)
```
PUT /api/outfits/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "notes": "Updated notes"
}
```

#### Delete Outfit (Protected)
```
DELETE /api/outfits/:id
Authorization: Bearer <token>
```

### User Routes (`/api/users`)

#### Get All Users (Admin Only)
```
GET /api/users
Authorization: Bearer <admin_token>
```

#### Get User by ID (Admin Only)
```
GET /api/users/:id
Authorization: Bearer <admin_token>
```

#### Delete User (Admin Only)
```
DELETE /api/users/:id
Authorization: Bearer <admin_token>
```

#### Health Check
```
GET /api/health
```

## 🔄 Authentication Flow

### Standard Flow (Stylists & Admins)
1. User selects role (Stylist/Admin) on landing page
2. Submits email and password
3. Server validates credentials
4. JWT token is generated and returned
5. Token and user info stored in localStorage
6. User redirected to role-based dashboard

### 2-Step Verification Flow (Customers Only)
1. User selects Customer role on landing page
2. Can sign up (new customer) or login (existing customer)
3. **Step 1**: Submits email and password
4. Server validates credentials
5. If valid, generates 6-digit OTP and sends via email
6. Returns temporary token (expires in 10 minutes)
7. **Step 2**: User enters OTP from email
8. Server verifies OTP (must be unused and not expired)
9. JWT token is generated and returned
10. Token and user info stored in localStorage
11. User redirected to customer dashboard

### Protected Routes
1. Frontend checks for valid token in localStorage
2. Token sent in Authorization header for protected API requests
3. Backend middleware validates token and extracts user info
4. Access granted/denied based on user role and permissions

## 🛡️ Security Features

- **Password Hashing**: Bcryptjs with salt rounds = 10
- **2-Step Email OTP**: Customers receive one-time passwords that expire in 10 minutes
- **OTP Auto-Expiration**: MongoDB TTL index automatically removes old OTPs
- **OTP Usage Tracking**: Each OTP can only be used once
- **JWT Authentication**: Secure token-based authentication with 7-day expiration
- **Temporary Tokens**: OTP verification uses separate temporary tokens (10 min expiration)
- **CORS**: Configured to accept requests from frontend only
- **Input Validation**: All inputs validated on server side using express-validator
- **Error Handling**: Secure error messages without exposing sensitive data
- **Email Service**: SMTP integration using nodemailer for secure OTP delivery
- **Role-Based Access Control**: Different endpoints accessible based on user role

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/haru-wardrobe
JWT_SECRET=your_jwt_secret_key_change_in_production
NODE_ENV=development

# 2FA Email Configuration (Optional for testing, Required for production)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
OTP_EXPIRY=600
```

**OTP_EXPIRY**: Time in seconds before OTP expires (600 = 10 minutes recommended)

### Frontend (.env - optional)
```
REACT_APP_API_URL=http://localhost:5000
```

## 🗄️ Database Schema

### User Model
```javascript
{
  username: String (unique, required, min 3),
  email: String (unique, required, valid email),
  password: String (hashed with bcryptjs, required, min 6),
  firstName: String (required),
  lastName: String (required),
  role: String (enum: ['customer', 'stylist', 'admin'], default: 'customer'),
  profileImage: String (optional),
  bio: String (optional),
  isActive: Boolean (default: true),
  createdAt: Date (default: now),
  updatedAt: Date
}
```

### Outfit Model
```javascript
{
  userId: ObjectId (reference to User, required),
  name: String (required),
  notes: String (optional),
  createdAt: Date (default: now),
  updatedAt: Date
}
```

### OTP Model
```javascript
{
  userId: ObjectId (reference to User, required),
  email: String (required),
  otp: String (6-digit code, required),
  isUsed: Boolean (default: false),
  createdAt: Date (default: now, TTL: 600 seconds = 10 minutes)
}
```

**OTP TTL Index**: MongoDB automatically deletes OTP records 10 minutes after creation

## 🚦 Running the Application

1. **Start MongoDB** (if not running as a service)
   ```bash
   mongod
   ```

2. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend** (in another terminal)
   ```bash
   cd frontend
   npm start
   ```

4. **Access the Application**
   - Open `http://localhost:3000` in your browser

## 📦 Dependencies

### Backend
- **express**: Web framework and routing
- **mongoose**: MongoDB ODM for data modeling
- **bcryptjs**: Password hashing with salt
- **jsonwebtoken**: JWT token generation and verification
- **dotenv**: Environment variable management
- **cors**: Cross-origin resource sharing
- **express-validator**: Input validation and sanitization
- **nodemailer**: SMTP email service for OTP delivery

### Frontend
- **react**: UI library and component framework
- **react-router-dom**: Client-side routing
- **axios**: HTTP client for API requests
- **react-scripts**: React app build tools and dev server

## 🔧 Available Scripts

### Backend
```bash
npm start      # Run production server
npm run dev    # Run with nodemon (development)
npm run seed   # Seed database with sample users
```

### Frontend
```bash
npm start      # Run development server
npm run build  # Build for production
npm test       # Run tests
```

## 🎨 UI/UX Features

- **Gradient Design**: Modern purple gradient theme
- **Responsive Layout**: Works on desktop and mobile
- **Smooth Transitions**: Hover effects and animations
- **Error Messages**: Clear validation and error feedback
- **Demo Credentials**: Easy testing with pre-filled accounts
- **Role-Based Dashboards**: Different interfaces for customers and stylists

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check connection URI in `.env` matches your MongoDB instance
- Verify MongoDB is listening on `localhost:27017`

### CORS Errors
- Ensure backend is running on `http://localhost:5000`
- Check CORS configuration in `server.js`
- Clear browser cache and localStorage

### Token Issues
- Clear localStorage and try logging in again
- Verify JWT_SECRET in backend `.env`
- Check token expiration time (7 days for JWT, 10 minutes for OTP temp token)

### OTP Not Received
- Verify EMAIL_SERVICE, EMAIL_USER, and EMAIL_PASSWORD are configured in `.env`
- For Gmail: Ensure you created an App Password (not your regular password)
- Check spam/junk folder for OTP email
- Verify OTP hasn't expired (10 minute window)

### OTP Expired Error
- OTP tokens expire after 10 minutes
- Use "Resend OTP" button to request a new code
- Temporary token for OTP verification also expires after 10 minutes

### Port Already in Use
- Backend: Change PORT in `.env` and restart
- Frontend: Kill process on port 3000 or use `PORT=3001 npm start`

### Login Page Not Loading
- Ensure frontend is running on `http://localhost:3000`
- Check browser console for errors
- Verify all routes are configured in `App.js`

### Cannot Create User Account
- Verify signup is only enabled for customers
- Check email format is valid
- Ensure username and email are not already taken
- Check password meets minimum length requirement (6 characters)

## 📈 Future Enhancements

- [ ] Email verification
- [ ] Password reset functionality
- [ ] User profile editing
- [ ] Outfit creation and management
- [ ] Wardrobe management
- [ ] Stylist search and filtering
- [ ] Appointment/consultation booking
- [ ] Reviews and ratings
- [ ] Image upload for items and outfits
- [ ] AI-powered outfit recommendations
- [ ] User following/followers
- [ ] Notifications system

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Created as a full-stack authentication system for the Haru Digital Wardrobe project.

---

Happy styling! 👗✨
