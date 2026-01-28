const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { generateOTP, sendOTPEmail } = require('../services/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', [
  body('username', 'Username is required').notEmpty().isLength({ min: 3 }),
  body('email', 'Please provide a valid email').isEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  body('firstName', 'First name is required').notEmpty(),
  body('lastName', 'Last name is required').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new customer (only customers can signup)
    user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: 'customer'  // Only customers can self-register
    });

    await user.save();

    // Create JWT Token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user (step 1: verify email and password)
// @access  Public
router.post('/login', [
  body('email', 'Please provide a valid email').isEmail(),
  body('password', 'Password is required').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Check for user
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account has been deactivated' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // If customer, send OTP
    if (user.role === 'customer') {
      try {
        // Generate OTP
        const otp = generateOTP();

        // Save OTP to database
        const otpRecord = new OTP({
          userId: user._id,
          email: user.email,
          otp: otp
        });
        await otpRecord.save();

        // Send OTP email
        await sendOTPEmail(user.email, otp, user.firstName);

        // Return temporary token for OTP verification
        const tempToken = jwt.sign({ id: user._id, type: 'otp' }, process.env.JWT_SECRET, {
          expiresIn: '10m'
        });

        return res.json({
          success: true,
          requiresOTP: true,
          tempToken,
          email: user.email,
          message: 'OTP sent to your email. Please verify to complete login.'
        });
      } catch (error) {
        return res.status(500).json({ 
          message: 'Failed to send OTP. Please try again.',
          error: error.message 
        });
      }
    }

    // For stylist and admin, directly return token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for customer login (step 2)
// @access  Public
router.post('/verify-otp', [
  body('otp', 'OTP is required').notEmpty().isLength({ min: 6, max: 6 }),
  body('tempToken', 'Temporary token is required').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { otp, tempToken } = req.body;

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      if (decoded.type !== 'otp') {
        return res.status(400).json({ message: 'Invalid token' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Token expired. Please login again.' });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      userId: decoded.id,
      otp: otp,
      isUsed: false
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Get user
    const user = await User.findById(decoded.id);

    // Create JWT Token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for customer login
// @access  Public
router.post('/resend-otp', [
  body('tempToken', 'Temporary token is required').notEmpty()
], async (req, res) => {
  try {
    const { tempToken } = req.body;

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      if (decoded.type !== 'otp') {
        return res.status(400).json({ message: 'Invalid token' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Token expired. Please login again.' });
    }

    // Delete old OTP records
    await OTP.deleteMany({ userId: decoded.id, isUsed: false });

    // Get user
    const user = await User.findById(decoded.id);

    try {
      // Generate new OTP
      const otp = generateOTP();

      // Save OTP to database
      const otpRecord = new OTP({
        userId: user._id,
        email: user.email,
        otp: otp
      });
      await otpRecord.save();

      // Send OTP email
      await sendOTPEmail(user.email, otp, user.firstName);

      res.json({
        success: true,
        message: 'OTP resent to your email'
      });
    } catch (error) {
      return res.status(500).json({ 
        message: 'Failed to resend OTP. Please try again.',
        error: error.message 
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
