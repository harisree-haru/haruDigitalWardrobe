const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/stylists
// @desc    Get all available stylists
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const stylists = await User.find({ 
      role: 'stylist',
      isAvailable: true 
    })
    .select('firstName lastName bio email maxAssignments currentAssignments')
    .sort({ currentAssignments: 1, firstName: 1 }); // Sort by workload, then name

    console.log(`[${new Date().toISOString()}] [STYLISTS_LIST] 📋 Retrieved ${stylists.length} available stylists`);

    res.json({
      success: true,
      count: stylists.length,
      stylists
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [STYLISTS_LIST] ❌ Error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/stylists/:id
// @desc    Get a specific stylist's details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const stylist = await User.findById(req.params.id)
      .select('firstName lastName bio email maxAssignments currentAssignments role');

    if (!stylist) {
      return res.status(404).json({ message: 'Stylist not found' });
    }

    if (stylist.role !== 'stylist') {
      return res.status(400).json({ message: 'User is not a stylist' });
    }

    res.json({
      success: true,
      stylist
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [STYLIST_DETAIL] ❌ Error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
