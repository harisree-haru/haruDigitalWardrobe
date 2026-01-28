const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const {
  generateRSAKeyPair,
  encryptPrivateKey
} = require('../services/encryptionService');
const { logKeyGeneration } = require('../services/loggingService');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get a specific user (admin only)
// @access  Private
router.get('/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/users/generate-keys
// @desc    Generate RSA key pair for user
// @access  Private
router.post('/generate-keys', auth, async (req, res) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${new Date().toISOString()}] [KEY_GENERATION] 🔑 Key generation request`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    const { password } = req.body;
    const userId = req.user.id;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required to encrypt private key' });
    }
    
    const user = await User.findById(userId);
    
    // Check if user already has keys
    if (user.publicKey && user.encryptedPrivateKey) {
      console.log(`[${new Date().toISOString()}] [KEY_GENERATION] ⚠️  User already has keys`);
      return res.status(400).json({ 
        message: 'User already has encryption keys',
        publicKey: user.publicKey
      });
    }
    
    // Generate RSA key pair
    const { publicKey, privateKey } = generateRSAKeyPair();
    
    // Encrypt private key with user's password
    const encryptedPrivateKey = encryptPrivateKey(privateKey, password);
    
    // Save keys to user record
    user.publicKey = publicKey;
    user.encryptedPrivateKey = encryptedPrivateKey;
    user.keyGeneratedAt = new Date();
    await user.save();
    
    // Log key generation
    await logKeyGeneration(userId, 'RSA-2048', req);
    
    console.log(`[${new Date().toISOString()}] [KEY_GENERATION] ✅ Keys generated and saved for user ${userId}`);
    console.log(`${'='.repeat(80)}\n`);
    
    res.json({
      success: true,
      message: 'Encryption keys generated successfully',
      publicKey,
      keyGeneratedAt: user.keyGeneratedAt
    });
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [KEY_GENERATION] ❌ Error:`, error.message);
    res.status(500).json({ message: 'Key generation failed', error: error.message });
  }
});

// @route   GET /api/users/stylists
// @desc    Get all available stylists
// @access  Private
router.get('/stylists/list', auth, async (req, res) => {
  try {
    const stylists = await User.find({
      role: 'stylist',
      isActive: true
    })
    .select('firstName lastName bio isAvailable currentAssignments maxAssignments')
    .sort({ currentAssignments: 1 }); // Sort by workload
    
    console.log(`[${new Date().toISOString()}] [STYLISTS_LIST] 📋 Retrieved ${stylists.length} stylists`);
    
    res.json({
      success: true,
      count: stylists.length,
      stylists: stylists.map(s => ({
        id: s._id,
        name: `${s.firstName} ${s.lastName}`,
        bio: s.bio,
        isAvailable: s.isAvailable && s.currentAssignments < s.maxAssignments,
        workload: `${s.currentAssignments}/${s.maxAssignments}`
      }))
    });
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [STYLISTS_LIST] ❌ Error:`, error.message);
    res.status(500).json({ message: 'Failed to retrieve stylists', error: error.message });
  }
});

module.exports = router;
