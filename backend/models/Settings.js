const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'Enterprise SaaS Inventory',
    },
    companyEmail: {
      type: String,
      default: 'info@saasinventory.com',
    },
    companyPhone: {
      type: String,
      default: '1234567890',
    },
    companyAddress: {
      type: String,
      default: '123 Tech Park, Phase 1',
    },
    logo: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'INR', // Default to Rupees
    },
    taxRate: {
      type: Number,
      default: 18, // 18% GST default
    },
    taxName: {
      type: String,
      default: 'GST',
    },
    smtpHost: {
      type: String,
      default: '',
    },
    smtpPort: {
      type: Number,
      default: 587,
    },
    smtpUser: {
      type: String,
      default: '',
    },
    smtpPass: {
      type: String,
      default: '',
    },
    smtpSecure: {
      type: Boolean,
      default: false,
    },
    themeDefault: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    backupSchedule: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'manual'],
      default: 'manual',
    },
    lastBackupDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', settingsSchema);
