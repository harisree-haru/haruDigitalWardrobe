const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Stylist Assignment Service
 * Handles automatic and manual stylist assignment for customers
 */

/**
 * Get available stylists sorted by current workload
 * @returns {Array} Array of available stylists
 */
const getAvailableStylists = async () => {
  console.log(`[${new Date().toISOString()}] [ASSIGNMENT] 🔍 Finding available stylists...`);
  
  const stylists = await User.find({
    role: 'stylist',
    isAvailable: true,
    isActive: true,
    $expr: { $lt: ['$currentAssignments', '$maxAssignments'] }
  }).sort({ currentAssignments: 1 }); // Sort by workload (ascending)
  
  console.log(`[${new Date().toISOString()}] [ASSIGNMENT] ✅ Found ${stylists.length} available stylists`);
  
  return stylists;
};

/**
 * Get stylist's current workload
 * @param {string} stylistId - Stylist's user ID
 * @returns {Object} Workload information
 */
const getStylistWorkload = async (stylistId) => {
  const stylist = await User.findById(stylistId);
  
  if (!stylist || stylist.role !== 'stylist') {
    throw new Error('Invalid stylist ID');
  }
  
  return {
    stylistId,
    currentAssignments: stylist.currentAssignments || 0,
    maxAssignments: stylist.maxAssignments || 10,
    isAvailable: stylist.isAvailable && stylist.currentAssignments < stylist.maxAssignments
  };
};

/**
 * Assign stylist automatically using round-robin/load-balancing
 * @param {string} customerId - Customer's user ID
 * @returns {Object} Assigned stylist
 */
const assignStylistAutomatically = async (customerId) => {
  console.log(`[${new Date().toISOString()}] [ASSIGNMENT] 🤖 Auto-assigning stylist for customer ${customerId}...`);
  
  const availableStylists = await getAvailableStylists();
  
  if (availableStylists.length === 0) {
    console.error(`[${new Date().toISOString()}] [ASSIGNMENT] ❌ No available stylists found`);
    throw new Error('No available stylists at the moment');
  }
  
  // Select stylist with lowest workload (first in sorted array)
  const selectedStylist = availableStylists[0];
  
  // Increment stylist's current assignments
  selectedStylist.currentAssignments = (selectedStylist.currentAssignments || 0) + 1;
  await selectedStylist.save();
  
  // Log the assignment
  await AuditLog.create({
    userId: customerId,
    action: 'STYLIST_ASSIGNED',
    resourceType: 'user',
    resourceId: selectedStylist._id,
    details: {
      method: 'automatic',
      stylistName: `${selectedStylist.firstName} ${selectedStylist.lastName}`,
      workload: selectedStylist.currentAssignments
    }
  });
  
  console.log(`[${new Date().toISOString()}] [ASSIGNMENT] ✅ Auto-assigned stylist: ${selectedStylist.firstName} ${selectedStylist.lastName} (workload: ${selectedStylist.currentAssignments}/${selectedStylist.maxAssignments})`);
  
  return selectedStylist;
};

/**
 * Assign stylist manually (customer selects)
 * @param {string} customerId - Customer's user ID
 * @param {string} stylistId - Selected stylist's user ID
 * @returns {Object} Assigned stylist
 */
const assignStylistManually = async (customerId, stylistId) => {
  console.log(`[${new Date().toISOString()}] [ASSIGNMENT] 👤 Manually assigning stylist ${stylistId} for customer ${customerId}...`);
  
  const stylist = await User.findById(stylistId);
  
  if (!stylist || stylist.role !== 'stylist') {
    console.error(`[${new Date().toISOString()}] [ASSIGNMENT] ❌ Invalid stylist ID`);
    throw new Error('Invalid stylist selected');
  }
  
  if (!stylist.isActive) {
    console.error(`[${new Date().toISOString()}] [ASSIGNMENT] ❌ Stylist is inactive`);
    throw new Error('Selected stylist is not active');
  }
  
  if (!stylist.isAvailable || stylist.currentAssignments >= stylist.maxAssignments) {
    console.error(`[${new Date().toISOString()}] [ASSIGNMENT] ❌ Stylist is not available`);
    throw new Error('Selected stylist is not available');
  }
  
  // Increment stylist's current assignments
  stylist.currentAssignments = (stylist.currentAssignments || 0) + 1;
  await stylist.save();
  
  // Log the assignment
  await AuditLog.create({
    userId: customerId,
    action: 'STYLIST_SELECTED',
    resourceType: 'user',
    resourceId: stylist._id,
    details: {
      method: 'manual',
      stylistName: `${stylist.firstName} ${stylist.lastName}`,
      workload: stylist.currentAssignments
    }
  });
  
  console.log(`[${new Date().toISOString()}] [ASSIGNMENT] ✅ Manually assigned stylist: ${stylist.firstName} ${stylist.lastName} (workload: ${stylist.currentAssignments}/${stylist.maxAssignments})`);
  
  return stylist;
};

/**
 * Unassign stylist (decrement workload)
 * @param {string} stylistId - Stylist's user ID
 */
const unassignStylist = async (stylistId) => {
  const stylist = await User.findById(stylistId);
  
  if (stylist && stylist.role === 'stylist') {
    stylist.currentAssignments = Math.max(0, (stylist.currentAssignments || 0) - 1);
    await stylist.save();
    
    console.log(`[${new Date().toISOString()}] [ASSIGNMENT] ✅ Unassigned stylist: ${stylist.firstName} ${stylist.lastName} (workload: ${stylist.currentAssignments}/${stylist.maxAssignments})`);
  }
};

module.exports = {
  getAvailableStylists,
  getStylistWorkload,
  assignStylistAutomatically,
  assignStylistManually,
  unassignStylist
};
