const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600  // Auto-delete OTP after 10 minutes (600 seconds)
  }
});

// Add compound index for better query performance
otpSchema.index({ userId: 1, isUsed: 1 });

module.exports = mongoose.model('OTP', otpSchema);
