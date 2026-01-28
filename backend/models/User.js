const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['customer', 'stylist', 'admin'],
    default: 'customer'
  },
  profileImage: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Encryption keys for secure design system
  publicKey: {
    type: String,
    default: null
  },
  encryptedPrivateKey: {
    type: String,
    default: null
  },
  keyGeneratedAt: {
    type: Date,
    default: null
  },
  // Stylist-specific fields
  isAvailable: {
    type: Boolean,
    default: function() {
      return this.role === 'stylist' ? true : undefined;
    }
  },
  maxAssignments: {
    type: Number,
    default: function() {
      return this.role === 'stylist' ? 10 : undefined;
    }
  },
  currentAssignments: {
    type: Number,
    default: function() {
      return this.role === 'stylist' ? 0 : undefined;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to match passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
