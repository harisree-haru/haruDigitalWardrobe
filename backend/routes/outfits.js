const express = require('express');
const router = express.Router();
const Outfit = require('../models/Outfit');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const {
  assignStylistAutomatically,
  assignStylistManually
} = require('../services/stylistAssignmentService');

// @route   POST /api/outfits
// @desc    Create a new outfit with stylist assignment
// @access  Private (Customers only)
router.post('/', auth, [
  body('name', 'Outfit name is required').notEmpty().isLength({ min: 2 }),
  body('notes', 'Notes must be a string').optional().isString(),
  body('assignmentMethod', 'Assignment method is required').isIn(['automatic', 'manual']),
  body('stylistId', 'Stylist ID is required for manual assignment').if(body('assignmentMethod').equals('manual')).notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, notes, assignmentMethod, stylistId } = req.body;
    const customerId = req.user.id;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`[${new Date().toISOString()}] [OUTFIT_CREATE] 📝 New outfit creation request`);
    console.log(`${'='.repeat(80)}\n`);

    // Assign stylist
    let assignedStylist;
    if (assignmentMethod === 'automatic') {
      console.log(`[${new Date().toISOString()}] [OUTFIT_CREATE] 🤖 Automatic stylist assignment`);
      assignedStylist = await assignStylistAutomatically(customerId);
    } else {
      console.log(`[${new Date().toISOString()}] [OUTFIT_CREATE] 👤 Manual stylist selection: ${stylistId}`);
      assignedStylist = await assignStylistManually(customerId, stylistId);
    }

    if (!assignedStylist) {
      return res.status(400).json({ message: 'No available stylists' });
    }

    // Create new outfit
    const outfit = new Outfit({
      customerId,
      stylistId: assignedStylist._id,
      name,
      notes: notes || '',
      assignmentMethod,
      status: 'pending'
    });

    await outfit.save();

    console.log(`[${new Date().toISOString()}] [OUTFIT_CREATE] ✅ Outfit created successfully`);
    console.log(`[${new Date().toISOString()}] [OUTFIT_CREATE] 📋 Outfit ID: ${outfit._id}`);
    console.log(`[${new Date().toISOString()}] [OUTFIT_CREATE] 👤 Assigned Stylist: ${assignedStylist.firstName} ${assignedStylist.lastName}`);
    console.log(`${'='.repeat(80)}\n`);

    res.status(201).json({
      success: true,
      outfit: {
        id: outfit._id,
        name: outfit.name,
        notes: outfit.notes,
        status: outfit.status,
        assignmentMethod: outfit.assignmentMethod,
        stylist: {
          id: assignedStylist._id,
          name: `${assignedStylist.firstName} ${assignedStylist.lastName}`,
          bio: assignedStylist.bio
        },
        createdAt: outfit.createdAt
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [OUTFIT_CREATE] ❌ Error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/outfits/list/my-outfits
// @desc    Get outfits for current user (customer's outfits or stylist's assignments)
// @access  Private
router.get('/list/my-outfits', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let outfits;
    if (user.role === 'customer') {
      outfits = await Outfit.find({ customerId: userId })
        .populate('stylistId', 'firstName lastName bio')
        .populate('suggestions.stylistId', 'firstName lastName')
        .sort({ createdAt: -1 });
    } else if (user.role === 'stylist') {
      outfits = await Outfit.find({ stylistId: userId })
        .populate('customerId', 'firstName lastName')
        .populate('suggestions.stylistId', 'firstName lastName')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log(`[${new Date().toISOString()}] [OUTFITS_LIST] 📋 Retrieved ${outfits.length} outfits for user ${userId}`);

    res.json({
      success: true,
      count: outfits.length,
      outfits: outfits.map(o => ({
        id: o._id,
        name: o.name,
        notes: o.notes,
        status: o.status,
        assignmentMethod: o.assignmentMethod,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        suggestions: o.suggestions,
        ...(user.role === 'customer' && {
          stylist: {
            id: o.stylistId._id,
            name: `${o.stylistId.firstName} ${o.stylistId.lastName}`,
            bio: o.stylistId.bio
          }
        }),
        ...(user.role === 'stylist' && {
          customer: {
            id: o.customerId._id,
            name: `${o.customerId.firstName} ${o.customerId.lastName}`
          }
        })
      }))
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [OUTFITS_LIST] ❌ Error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/outfits/:id
// @desc    Get a specific outfit
// @access  Private (Customer or assigned stylist)
router.get('/:id', auth, async (req, res) => {
  try {
    const outfit = await Outfit.findById(req.params.id)
      .populate('customerId', 'firstName lastName')
      .populate('stylistId', 'firstName lastName bio')
      .populate('suggestions.stylistId', 'firstName lastName');

    if (!outfit) {
      return res.status(404).json({ message: 'Outfit not found' });
    }

    // Check if user is customer or assigned stylist
    const isCustomer = outfit.customerId._id.toString() === req.user.id;
    const isStylist = outfit.stylistId._id.toString() === req.user.id;

    if (!isCustomer && !isStylist) {
      return res.status(403).json({ message: 'Not authorized to view this outfit' });
    }

    res.json({
      success: true,
      outfit
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/outfits/:id
// @desc    Update an outfit
// @access  Private
router.put('/:id', auth, [
  body('name', 'Outfit name is required').notEmpty().isLength({ min: 2 }),
  body('notes', 'Notes must be a string').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let outfit = await Outfit.findById(req.params.id);

    if (!outfit) {
      return res.status(404).json({ message: 'Outfit not found' });
    }

    // Check if user owns this outfit
    if (outfit.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this outfit' });
    }

    const { name, notes } = req.body;

    outfit.name = name;
    outfit.notes = notes || '';
    outfit.updatedAt = Date.now();

    await outfit.save();

    res.json({
      success: true,
      outfit
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/outfits/:id
// @desc    Delete an outfit
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const outfit = await Outfit.findById(req.params.id);

    if (!outfit) {
      return res.status(404).json({ message: 'Outfit not found' });
    }

    // Check if user owns this outfit
    if (outfit.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this outfit' });
    }

    await Outfit.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Outfit deleted'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/outfits/user/:userId
// @desc    Get all outfits for a specific user (for stylists to view)
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const outfits = await Outfit.find({ userId: req.params.userId })
      .populate('userId', 'username email firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: outfits.length,
      outfits
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/outfits/:id/suggestions
// @desc    Add a suggestion to an outfit (Stylist only)
// @access  Private (Assigned stylist only)
router.post('/:id/suggestions', auth, [
  body('suggestion', 'Suggestion text is required').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { suggestion } = req.body;
    const stylistId = req.user.id;

    const outfit = await Outfit.findById(req.params.id);

    if (!outfit) {
      return res.status(404).json({ message: 'Outfit not found' });
    }

    // Check if user is the assigned stylist
    if (outfit.stylistId.toString() !== stylistId) {
      return res.status(403).json({ message: 'Only the assigned stylist can add suggestions' });
    }

    // Add suggestion
    outfit.suggestions.push({
      stylistId,
      suggestion,
      createdAt: new Date()
    });

    // Update outfit status to in_progress if it's pending
    if (outfit.status === 'pending') {
      outfit.status = 'in_progress';
    }

    await outfit.save();

    console.log(`[${new Date().toISOString()}] [OUTFIT_SUGGESTION] ✅ Suggestion added to outfit ${outfit._id}`);

    res.status(201).json({
      success: true,
      message: 'Suggestion added successfully',
      outfit
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [OUTFIT_SUGGESTION] ❌ Error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/outfits/:id/suggestions
// @desc    Get all suggestions for an outfit
// @access  Private (Customer or assigned stylist)
router.get('/:id/suggestions', auth, async (req, res) => {
  try {
    const outfit = await Outfit.findById(req.params.id)
      .populate('suggestions.stylistId', 'firstName lastName');

    if (!outfit) {
      return res.status(404).json({ message: 'Outfit not found' });
    }

    // Check if user is customer or assigned stylist
    const isCustomer = outfit.customerId.toString() === req.user.id;
    const isStylist = outfit.stylistId.toString() === req.user.id;

    if (!isCustomer && !isStylist) {
      return res.status(403).json({ message: 'Not authorized to view suggestions' });
    }

    res.json({
      success: true,
      suggestions: outfit.suggestions
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [OUTFIT_SUGGESTIONS] ❌ Error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
