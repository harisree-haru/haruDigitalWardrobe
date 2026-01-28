const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stylistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  designType: {
    type: String,
    enum: ['photo', 'options'],
    required: true
  },
  // Encrypted design data
  encryptedData: {
    type: String,
    required: true
  },
  // AES key encrypted with customer's public key (so customer can decrypt)
  encryptedAESKeyForCustomer: {
    type: String,
    required: true
  },
  // AES key encrypted with stylist's public key (so stylist can decrypt)
  encryptedAESKeyForStylist: {
    type: String,
    required: true
  },
  // Initialization vector for AES encryption
  iv: {
    type: String,
    required: true
  },
  // Digital signature from customer
  digitalSignature: {
    type: String,
    required: true
  },
  // Path to encrypted image file (if designType is 'photo')
  imageUrl: {
    type: String,
    default: null
  },
  // Encrypted style options (if designType is 'options')
  styleOptions: {
    type: String,
    default: null
  },
  // Design status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  // Assignment method
  assignmentMethod: {
    type: String,
    enum: ['automatic', 'manual'],
    required: true
  },
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
designSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
designSchema.index({ customerId: 1, createdAt: -1 });
designSchema.index({ stylistId: 1, status: 1 });
designSchema.index({ status: 1 });

module.exports = mongoose.model('Design', designSchema);
