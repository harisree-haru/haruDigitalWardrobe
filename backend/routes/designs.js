const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const Design = require('../models/Design');
const User = require('../models/User');
const auth = require('../middleware/auth');
const {
  generateAESKey,
  generateIV,
  encryptWithAES,
  decryptWithAES,
  encryptAESKeyWithRSA,
  decryptAESKeyWithRSA,
  createDigitalSignature,
  verifyDigitalSignature,
  decryptPrivateKey
} = require('../services/encryptionService');
const {
  assignStylistAutomatically,
  assignStylistManually
} = require('../services/stylistAssignmentService');
const {
  logDesignUpload,
  logDesignView,
  logEncryption,
  logDecryption,
  logAccessDenied
} = require('../services/loggingService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/designs/encrypted');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @route   POST /api/designs/upload
// @desc    Upload design with encryption (photo or options)
// @access  Private (Customer only)
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${new Date().toISOString()}] [DESIGN_UPLOAD] 📤 New design upload request`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    const { designType, styleOptions, stylistId, password } = req.body;
    const customerId = req.user.id;
    
    // Verify user is a customer
    const customer = await User.findById(customerId);
    if (!customer || customer.role !== 'customer') {
      console.error(`[${new Date().toISOString()}] [DESIGN_UPLOAD] ❌ Access denied: User is not a customer`);
      await logAccessDenied(customerId, 'design', null, 'Not a customer', req);
      return res.status(403).json({ message: 'Only customers can upload designs' });
    }
    
    // Verify customer has encryption keys
    if (!customer.publicKey || !customer.encryptedPrivateKey) {
      console.error(`[${new Date().toISOString()}] [DESIGN_UPLOAD] ❌ Customer has no encryption keys`);
      return res.status(400).json({ message: 'Please generate encryption keys first' });
    }
    
    // Verify password and decrypt customer's private key
    let customerPrivateKey;
    try {
      customerPrivateKey = decryptPrivateKey(customer.encryptedPrivateKey, password);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [DESIGN_UPLOAD] ❌ Invalid password`);
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    // Assign stylist (automatic or manual)
    let assignedStylist;
    let assignmentMethod;
    
    if (stylistId) {
      console.log(`[${new Date().toISOString()}] [DESIGN_UPLOAD] 👤 Manual stylist selection: ${stylistId}`);
      assignedStylist = await assignStylistManually(customerId, stylistId);
      assignmentMethod = 'manual';
    } else {
      console.log(`[${new Date().toISOString()}] [DESIGN_UPLOAD] 🤖 Automatic stylist assignment`);
      assignedStylist = await assignStylistAutomatically(customerId);
      assignmentMethod = 'automatic';
    }
    
    // Verify stylist has encryption keys
    if (!assignedStylist.publicKey) {
      console.error(`[${new Date().toISOString()}] [DESIGN_UPLOAD] ❌ Stylist has no public key`);
      return res.status(500).json({ message: 'Stylist encryption keys not configured' });
    }
    
    // Prepare design data
    let designData = {
      designType,
      customerId,
      customerName: `${customer.firstName} ${customer.lastName}`,
      timestamp: new Date().toISOString()
    };
    
    if (designType === 'photo' && req.file) {
      designData.imageFilename = req.file.filename;
      designData.imagePath = req.file.path;
      console.log(`[${new Date().toISOString()}] [DESIGN_UPLOAD] 🖼️  Image uploaded: ${req.file.filename}`);
    } else if (designType === 'options' && styleOptions) {
      designData.styleOptions = JSON.parse(styleOptions);
      console.log(`[${new Date().toISOString()}] [DESIGN_UPLOAD] 📝 Style options provided`);
    } else {
      return res.status(400).json({ message: 'Invalid design type or missing data' });
    }
    
    // Generate AES key and IV
    const aesKey = generateAESKey();
    const iv = generateIV();
    
    // Encrypt design data with AES
    const encryptedData = encryptWithAES(designData, aesKey, iv);
    await logEncryption(customerId, 'design_data', 'AES-256-CBC', req);
    
    // Encrypt AES key with BOTH customer's and stylist's public keys
    const encryptedAESKeyForCustomer = encryptAESKeyWithRSA(aesKey, customer.publicKey);
    console.log(`[${new Date().toISOString()}] [ENCRYPTION] 🔐 AES key encrypted with customer's public key`);
    
    const encryptedAESKeyForStylist = encryptAESKeyWithRSA(aesKey, assignedStylist.publicKey);
    console.log(`[${new Date().toISOString()}] [ENCRYPTION] 🔐 AES key encrypted with stylist's public key`);
    
    // Create digital signature with customer's private key
    const digitalSignature = createDigitalSignature(designData, customerPrivateKey);
    
    // Save encrypted design to database
    const design = new Design({
      customerId,
      stylistId: assignedStylist._id,
      designType,
      encryptedData,
      encryptedAESKeyForCustomer,
      encryptedAESKeyForStylist,
      iv: iv.toString('base64'),
      digitalSignature,
      imageUrl: req.file ? req.file.path : null,
      assignmentMethod,
      status: 'pending'
    });
    
    await design.save();
    
    // Log design upload
    await logDesignUpload(customerId, design._id, designType, req);
    
    console.log(`\n[${new Date().toISOString()}] [DESIGN_UPLOAD] ✅ Design uploaded successfully`);
    console.log(`[${new Date().toISOString()}] [DESIGN_UPLOAD] 📋 Design ID: ${design._id}`);
    console.log(`[${new Date().toISOString()}] [DESIGN_UPLOAD] 👤 Assigned Stylist: ${assignedStylist.firstName} ${assignedStylist.lastName}`);
    console.log(`${'='.repeat(80)}\n`);
    
    res.status(201).json({
      success: true,
      message: 'Design uploaded and encrypted successfully',
      design: {
        id: design._id,
        designType: design.designType,
        status: design.status,
        assignedStylist: {
          id: assignedStylist._id,
          name: `${assignedStylist.firstName} ${assignedStylist.lastName}`,
          bio: assignedStylist.bio
        },
        assignmentMethod,
        createdAt: design.createdAt
      }
    });
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [DESIGN_UPLOAD] ❌ Error:`, error.message);
    console.error(error.stack);
    res.status(500).json({ message: 'Design upload failed', error: error.message });
  }
});

// @route   POST /api/designs/:id/decrypt
// @desc    Decrypt design (password in body for automatic decryption)
// @access  Private (Customer or assigned stylist only)
router.post('/:id/decrypt', auth, async (req, res) => {
  console.log(`\\n${'='.repeat(80)}`);
  console.log(`[${new Date().toISOString()}] [DESIGN_DECRYPT] 🔓 Design decryption request`);
  console.log(`${'='.repeat(80)}\\n`);
  
  try {
    const { id } = req.params;
    const { password } = req.body;
    const userId = req.user.id;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    // Find design
    const design = await Design.findById(id);
    if (!design) {
      console.error(`[${new Date().toISOString()}] [DESIGN_DECRYPT] ❌ Design not found`);
      return res.status(404).json({ message: 'Design not found' });
    }
    
    // Verify access (customer or assigned stylist only)
    const isCustomer = design.customerId.toString() === userId;
    const isStylist = design.stylistId.toString() === userId;
    
    if (!isCustomer && !isStylist) {
      console.error(`[${new Date().toISOString()}] [DESIGN_DECRYPT] ❌ Access denied`);
      await logAccessDenied(userId, 'design', id, 'Not authorized', req);
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get user and verify encryption keys
    const user = await User.findById(userId);
    if (!user.encryptedPrivateKey) {
      return res.status(400).json({ message: 'User has no encryption keys' });
    }
    
    // Decrypt user's private key
    let userPrivateKey;
    try {
      userPrivateKey = decryptPrivateKey(user.encryptedPrivateKey, password);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [DESIGN_DECRYPT] ❌ Invalid password`);
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    // Select the correct encrypted AES key based on user role
    const encryptedAESKey = isCustomer 
      ? design.encryptedAESKeyForCustomer 
      : design.encryptedAESKeyForStylist;
    
    console.log(`[${new Date().toISOString()}] [DESIGN_DECRYPT] 🔑 Using encrypted AES key for ${isCustomer ? 'customer' : 'stylist'}`);
    
    // Decrypt AES key with user's private key
    const aesKey = decryptAESKeyWithRSA(encryptedAESKey, userPrivateKey);
    
    // Decrypt design data
    const decryptedData = decryptWithAES(
      design.encryptedData,
      aesKey,
      Buffer.from(design.iv, 'base64')
    );
    await logDecryption(userId, 'design_data', req);
    
    // Get customer's public key for signature verification
    const customer = await User.findById(design.customerId);
    const signatureValid = verifyDigitalSignature(
      decryptedData,
      design.digitalSignature,
      customer.publicKey
    );
    
    // Log design view
    await logDesignView(userId, design._id, req);
    
    console.log(`[${new Date().toISOString()}] [DESIGN_DECRYPT] ✅ Design decrypted successfully`);
    console.log(`[${new Date().toISOString()}] [DESIGN_DECRYPT] ✍️  Signature valid: ${signatureValid}`);
    console.log(`${'='.repeat(80)}\\n`);
    
    res.json({
      success: true,
      design: {
        id: design._id,
        designType: design.designType,
        data: decryptedData,
        status: design.status,
        signatureValid,
        createdAt: design.createdAt,
        updatedAt: design.updatedAt
      }
    });
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [DESIGN_DECRYPT] ❌ Error:`, error.message);
    res.status(500).json({ message: 'Failed to decrypt design', error: error.message });
  }
});

// @route   GET /api/designs/:id
// @desc    Retrieve and decrypt design (legacy - password in query)
// @access  Private (Customer or assigned stylist only)
router.get('/:id', auth, async (req, res) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${new Date().toISOString()}] [DESIGN_VIEW] 👁️  Design retrieval request`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    const { id } = req.params;
    const { password } = req.query;
    const userId = req.user.id;
    
    // Find design
    const design = await Design.findById(id);
    if (!design) {
      console.error(`[${new Date().toISOString()}] [DESIGN_VIEW] ❌ Design not found`);
      return res.status(404).json({ message: 'Design not found' });
    }
    
    // Verify access (customer or assigned stylist only)
    const isCustomer = design.customerId.toString() === userId;
    const isStylist = design.stylistId.toString() === userId;
    
    if (!isCustomer && !isStylist) {
      console.error(`[${new Date().toISOString()}] [DESIGN_VIEW] ❌ Access denied`);
      await logAccessDenied(userId, 'design', id, 'Not authorized', req);
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get user and verify encryption keys
    const user = await User.findById(userId);
    if (!user.encryptedPrivateKey) {
      return res.status(400).json({ message: 'User has no encryption keys' });
    }
    
    // Decrypt user's private key
    let userPrivateKey;
    try {
      userPrivateKey = decryptPrivateKey(user.encryptedPrivateKey, password);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [DESIGN_VIEW] ❌ Invalid password`);
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    // Select the correct encrypted AES key based on user role
    const encryptedAESKey = isCustomer 
      ? design.encryptedAESKeyForCustomer 
      : design.encryptedAESKeyForStylist;
    
    console.log(`[${new Date().toISOString()}] [DESIGN_VIEW] 🔑 Using encrypted AES key for ${isCustomer ? 'customer' : 'stylist'}`);
    
    // Decrypt AES key with user's private key
    const aesKey = decryptAESKeyWithRSA(encryptedAESKey, userPrivateKey);
    
    // Decrypt design data
    const decryptedData = decryptWithAES(
      design.encryptedData,
      aesKey,
      Buffer.from(design.iv, 'base64')
    );
    await logDecryption(userId, 'design_data', req);
    
    // Get customer's public key for signature verification
    const customer = await User.findById(design.customerId);
    const signatureValid = verifyDigitalSignature(
      decryptedData,
      design.digitalSignature,
      customer.publicKey
    );
    
    // Log design view
    await logDesignView(userId, design._id, req);
    
    console.log(`[${new Date().toISOString()}] [DESIGN_VIEW] ✅ Design decrypted successfully`);
    console.log(`[${new Date().toISOString()}] [DESIGN_VIEW] ✍️  Signature valid: ${signatureValid}`);
    console.log(`${'='.repeat(80)}\n`);
    
    res.json({
      success: true,
      design: {
        id: design._id,
        designType: design.designType,
        data: decryptedData,
        status: design.status,
        signatureValid,
        createdAt: design.createdAt,
        updatedAt: design.updatedAt
      }
    });
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [DESIGN_VIEW] ❌ Error:`, error.message);
    res.status(500).json({ message: 'Failed to retrieve design', error: error.message });
  }
});

// @route   GET /api/designs/my-designs
// @desc    Get user's designs (customer's uploads or stylist's assignments)
// @access  Private
router.get('/list/my-designs', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user and check if exists
    const user = await User.findById(userId);
    if (!user) {
      console.error(`[${new Date().toISOString()}] [DESIGNS_LIST] ❌ User not found: ${userId}`);
      return res.status(404).json({ message: 'User not found. Please login again.' });
    }
    
    console.log(`[${new Date().toISOString()}] [DESIGNS_LIST] 👤 User: ${user.firstName} ${user.lastName} (${user.role})`);
    
    // Build query based on user role
    let query = {};
    let designs;
    if (user.role === 'customer') {
      query = { customerId: userId };
      designs = await Design.find(query)
        .populate('stylistId', 'firstName lastName bio')
        .sort({ createdAt: -1 });
    } else if (user.role === 'stylist') {
      query = { stylistId: userId };
      designs = await Design.find(query)
        .populate('customerId', 'firstName lastName')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    console.log(`[${new Date().toISOString()}] [DESIGNS_LIST] 📋 Retrieved ${designs.length} designs for user ${userId}`);
    
    res.json({
      success: true,
      count: designs.length,
      designs: designs.map(d => ({
        id: d._id,
        designType: d.designType,
        status: d.status,
        assignmentMethod: d.assignmentMethod,
        createdAt: d.createdAt,
        ...(user.role === 'customer' && {
          stylist: {
            id: d.stylistId._id,
            name: `${d.stylistId.firstName} ${d.stylistId.lastName}`,
            bio: d.stylistId.bio
          }
        }),
        ...(user.role === 'stylist' && {
          customer: {
            id: d.customerId._id,
            name: `${d.customerId.firstName} ${d.customerId.lastName}`
          }
        })
      }))
    });
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [DESIGNS_LIST] ❌ Error:`, error.message);
    res.status(500).json({ message: 'Failed to retrieve designs', error: error.message });
  }
});

// @route   GET /api/designs/image/:filename
// @desc    Serve encrypted image file
// @access  Private
router.get('/image/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.resolve(__dirname, '../uploads/designs/encrypted', filename);
    
    console.log(`[${new Date().toISOString()}] [IMAGE_SERVE] 📷 Serving image: ${filename}`);
    console.log(`[${new Date().toISOString()}] [IMAGE_SERVE] 📁 Full path: ${imagePath}`);
    
    // Check if file exists
    try {
      await fs.access(imagePath);
      console.log(`[${new Date().toISOString()}] [IMAGE_SERVE] ✅ File exists`);
    } catch {
      console.error(`[${new Date().toISOString()}] [IMAGE_SERVE] ❌ File not found: ${imagePath}`);
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Send the file
    res.sendFile(imagePath);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [IMAGE_SERVE] ❌ Error:`, error.message);
    res.status(500).json({ message: 'Failed to serve image' });
  }
});

module.exports = router;
