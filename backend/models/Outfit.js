const mongoose = require('mongoose');

const outfitSchema = new mongoose.Schema({
  // Customer who created the outfit
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Assigned stylist
  stylistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Outfit details
  name: {
    type: String,
    required: [true, 'Please provide an outfit name'],
    trim: true,
    minlength: 2
  },
  notes: {
    type: String,
    default: ''
  },
  // Assignment method
  assignmentMethod: {
    type: String,
    enum: ['automatic', 'manual'],
    required: true
  },
  // Outfit status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  // Stylist suggestions
  suggestions: [{
    stylistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    suggestion: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
outfitSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
outfitSchema.index({ customerId: 1, createdAt: -1 });
outfitSchema.index({ stylistId: 1, status: 1 });
outfitSchema.index({ status: 1 });

module.exports = mongoose.model('Outfit', outfitSchema);
