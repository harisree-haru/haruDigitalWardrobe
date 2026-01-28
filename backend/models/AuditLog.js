const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'KEY_GENERATED',
      'DESIGN_UPLOADED',
      'DESIGN_VIEWED',
      'DATA_ENCRYPTED',
      'DATA_DECRYPTED',
      'SIGNATURE_CREATED',
      'SIGNATURE_VERIFIED',
      'ENVELOPE_CREATED',
      'ENVELOPE_OPENED',
      'STYLIST_ASSIGNED',
      'STYLIST_SELECTED',
      'IMAGE_UPLOADED',
      'ACCESS_DENIED',
      'LOGIN',
      'LOGOUT'
    ]
  },
  resourceType: {
    type: String,
    enum: ['design', 'user', 'key', 'system'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
