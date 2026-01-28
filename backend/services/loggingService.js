const AuditLog = require('../models/AuditLog');

/**
 * Logging Service
 * Provides comprehensive logging for all system actions
 */

/**
 * Log any action to database and console
 * @param {string} userId - User performing the action
 * @param {string} action - Action type
 * @param {string} resourceType - Type of resource
 * @param {string} resourceId - ID of affected resource
 * @param {Object} details - Additional details
 * @param {Object} req - Express request object (optional)
 */
const logAction = async (userId, action, resourceType, resourceId, details = {}, req = null) => {
  const timestamp = new Date().toISOString();
  
  // Console logging with colors
  const actionEmoji = {
    KEY_GENERATED: '🔑',
    DESIGN_UPLOADED: '📤',
    DESIGN_VIEWED: '👁️',
    DATA_ENCRYPTED: '🔐',
    DATA_DECRYPTED: '🔓',
    SIGNATURE_CREATED: '✍️',
    SIGNATURE_VERIFIED: '✅',
    ENVELOPE_CREATED: '📧',
    ENVELOPE_OPENED: '📬',
    STYLIST_ASSIGNED: '🤖',
    STYLIST_SELECTED: '👤',
    IMAGE_UPLOADED: '🖼️',
    ACCESS_DENIED: '🚫',
    LOGIN: '🔐',
    LOGOUT: '👋'
  };
  
  const emoji = actionEmoji[action] || '📝';
  
  console.log(`[${timestamp}] [${action}] ${emoji} User: ${userId} | Resource: ${resourceType}/${resourceId || 'N/A'} | Details: ${JSON.stringify(details)}`);
  
  // Database logging
  try {
    await AuditLog.create({
      userId,
      action,
      resourceType,
      resourceId: resourceId || null,
      details,
      ipAddress: req ? (req.ip || req.connection.remoteAddress) : null,
      userAgent: req ? req.get('user-agent') : null,
      timestamp: new Date()
    });
  } catch (error) {
    console.error(`[${timestamp}] [LOGGING] ❌ Failed to save audit log:`, error.message);
  }
};

/**
 * Log encryption operation
 */
const logEncryption = async (userId, dataType, algorithm, req = null) => {
  await logAction(
    userId,
    'DATA_ENCRYPTED',
    'system',
    null,
    { dataType, algorithm },
    req
  );
};

/**
 * Log decryption operation
 */
const logDecryption = async (userId, dataType, req = null) => {
  await logAction(
    userId,
    'DATA_DECRYPTED',
    'system',
    null,
    { dataType },
    req
  );
};

/**
 * Log key generation
 */
const logKeyGeneration = async (userId, keyType, req = null) => {
  await logAction(
    userId,
    'KEY_GENERATED',
    'key',
    null,
    { keyType },
    req
  );
};

/**
 * Log stylist assignment
 */
const logStylistAssignment = async (customerId, stylistId, method, stylistName, req = null) => {
  await logAction(
    customerId,
    method === 'automatic' ? 'STYLIST_ASSIGNED' : 'STYLIST_SELECTED',
    'user',
    stylistId,
    { method, stylistName },
    req
  );
};

/**
 * Log design upload
 */
const logDesignUpload = async (customerId, designId, designType, req = null) => {
  await logAction(
    customerId,
    'DESIGN_UPLOADED',
    'design',
    designId,
    { designType },
    req
  );
};

/**
 * Log design view
 */
const logDesignView = async (userId, designId, req = null) => {
  await logAction(
    userId,
    'DESIGN_VIEWED',
    'design',
    designId,
    {},
    req
  );
};

/**
 * Log access denied
 */
const logAccessDenied = async (userId, resourceType, resourceId, reason, req = null) => {
  await logAction(
    userId,
    'ACCESS_DENIED',
    resourceType,
    resourceId,
    { reason },
    req
  );
};

module.exports = {
  logAction,
  logEncryption,
  logDecryption,
  logKeyGeneration,
  logStylistAssignment,
  logDesignUpload,
  logDesignView,
  logAccessDenied
};
