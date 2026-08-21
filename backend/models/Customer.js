const mongoose = require('mongoose');

/**
 * Customer Schema
 * Complete business/contact/address/financial details for enterprise use
 */
const customerSchema = new mongoose.Schema(
  {
    // === Identity & Contact ===
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    customerType: {
      type: String,
      enum: ['retail', 'wholesale', 'distributor', 'corporate', 'vip'],
      default: 'retail',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },

    // === Address ===
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      default: 'India',
    },
    pincode: {
      type: String,
      trim: true,
      default: '',
    },

    // === Financial & Legal ===
    gstNumber: {
      type: String,
      trim: true,
      default: '',
    },
    panNumber: {
      type: String,
      trim: true,
      default: '',
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    creditPeriod: {
      // days
      type: Number,
      default: 0,
      min: 0,
    },

    // === Loyalty & Analytics ===
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    outstandingPayments: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPurchaseDate: {
      type: Date,
    },

    // === Misc ===
    notes: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ name: 'text', email: 'text', phone: 'text', companyName: 'text' });
customerSchema.index({ email: 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ customerType: 1 });

module.exports = mongoose.model('Customer', customerSchema);
