const mongoose = require('mongoose');

/**
 * Activity Log Schema
 * Tracks all user actions for audit trail
 */
const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      enum: ['products', 'suppliers', 'customers', 'sales', 'purchases', 'users', 'reports'],
    },
    resourceId: mongoose.Schema.Types.ObjectId,
    resourceType: String,
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
    device: String,
    browser: String,
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
