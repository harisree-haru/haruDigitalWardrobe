# Haru Digital Wardrobe 👗

A secure digital wardrobe management system with end-to-end encryption, stylist assignment, and design upload capabilities.

## 🌟 Features

- **Secure Design Upload**: End-to-end encryption using hybrid cryptography (AES-256 + RSA-2048)
- **Stylist Assignment**: Automatic or manual stylist assignment for personalized styling
- **Outfit Management**: Create and manage outfits with stylist suggestions
- **Digital Signatures**: Ensure data integrity with cryptographic signatures
- **Role-Based Access**: Customer, Stylist, and Admin roles
- **OTP Authentication**: Secure email-based OTP verification

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** with Mongoose
- **JWT** for authentication
- **node-rsa** for encryption
- **Nodemailer** for email OTP
- **Multer** for file uploads

### Frontend
- **React.js**
- **React Router** for navigation
- **Axios** for API calls
- **CSS3** for styling

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Git**

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/haruDigitalWardrobe.git
cd haruDigitalWardrobe
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Configure `.env` file:**
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/haru-wardrobe
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/haru-wardrobe

# Server
PORT=5002
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Email Configuration (for OTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Seed Stylists (Optional but Recommended):**
```bash
node seedStylists.js
```

This creates 5 demo stylist accounts with encryption keys.

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd frontend

# Install dependencies
npm install
```

The frontend is configured to proxy API requests to `http://localhost:5002`.

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5002`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:3000`

## 👥 Demo Accounts

### Stylists
After running `seedStylists.js`, you can login with:
- **Email**: `emma.stylist@example.com`
- **Password**: `password123`

(4 more stylist accounts available - check console output after seeding)

### Customers
Register a new customer account through the app or use existing accounts.

## 📁 Project Structure

```
haruDigitalWardrobe/
├── backend/
│   ├── config/           # Database configuration
│   ├── middleware/       # Auth middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic (encryption, assignment)
│   ├── uploads/         # Encrypted file storage
│   ├── seedStylists.js  # Stylist seeding script
│   └── server.js        # Entry point
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/  # Reusable components
│       ├── context/     # React context (Auth)
│       ├── pages/       # Page components
│       └── styles/      # CSS files
└── README.md
```

## 🔐 Security Features

1. **Hybrid Encryption**:
   - AES-256-CBC for data encryption
   - RSA-2048 for key encryption
   - Dual key encryption (customer + stylist)

2. **Digital Signatures**:
   - RSA signatures for data integrity
   - Automatic signature verification

3. **Secure Key Storage**:
   - Private keys encrypted with password-derived keys
   - PBKDF2 key derivation

4. **OTP Authentication**:
   - Email-based OTP verification
   - 10-minute expiration

## 🎯 Key Workflows

### Design Upload
1. Customer uploads design (photo or style options)
2. System encrypts data with AES
3. AES key encrypted with customer's and stylist's public keys
4. Design signed with customer's private key
5. Stylist automatically assigned (or manually selected)

### Outfit Creation
1. Customer creates outfit
2. Choose automatic or manual stylist assignment
3. Stylist receives assignment
4. Stylist can add suggestions

### Viewing Designs
1. User requests design
2. System automatically decrypts using user's private key
3. Signature verified for integrity
4. Decrypted data displayed

## 🧪 Testing

### Manual Testing Checklist
- [ ] Customer registration with OTP
- [ ] Customer login
- [ ] Design upload (photo)
- [ ] Design upload (style options)
- [ ] Automatic stylist assignment
- [ ] Manual stylist selection
- [ ] View My Designs
- [ ] Stylist login
- [ ] Stylist view assigned designs
- [ ] Add outfit
- [ ] View outfits

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5002
lsof -ti:5002 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check MongoDB Atlas connection
- Verify `MONGODB_URI` in `.env`

### Email OTP Not Working
- Use Gmail App Password (not regular password)
- Enable "Less secure app access" or use App-Specific Password
- Check EMAIL_USER and EMAIL_PASS in `.env`

### Encryption Errors
- Ensure stylists are seeded: `node seedStylists.js`
- Clear old data if schema changed:
  - `node removeDesigns.js`
  - `node removeOutfits.js`

## 📝 Environment Variables

Create `.env` file in `backend/` directory:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5002
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:3000
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Praneeth Udayakumar

## 🙏 Acknowledgments

- Built with ❤️ using MERN stack
- Encryption powered by node-rsa
- UI inspired by modern design principles