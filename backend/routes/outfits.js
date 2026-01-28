const express = require('express');
const router = express.Router();
const Outfit = require('../models/Outfit');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// @route   POST /api/outfits
// @desc    Create a new outfit
// @access  Private (Customers only)
router.post('/', auth, [
  body('name', 'Outfit name is required').notEmpty().isLength({ min: 2 }),
  body('notes', 'Notes must be a string').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, notes } = req.body;

    // Create new outfit
    const outfit = new Outfit({
      userId: req.user.id,
      name,
      notes: notes || ''
    });

    await outfit.save();

    res.status(201).json({
      success: true,
      outfit
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/outfits
// @desc    Get all outfits for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const outfits = await Outfit.find({ userId: req.user.id })
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

// @route   GET /api/outfits/:id
// @desc    Get a specific outfit
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const outfit = await Outfit.findById(req.params.id)
      .populate('userId', 'username email firstName lastName');

    if (!outfit) {
      return res.status(404).json({ message: 'Outfit not found' });
    }

    // Check if user owns this outfit
    if (outfit.userId._id.toString() !== req.user.id) {
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

module.exports = router;
