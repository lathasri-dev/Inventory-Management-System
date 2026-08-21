const mongoose = require('mongoose');

/**
 * Supplier Schema
 * Complete business/contact/address/financial details for enterprise use
 */
const supplierSchema = new mongoose.Schema(
  {
    // === Contact & Identity ===
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    businessType: {
      type: String,
      enum: ['manufacturer', 'wholesaler', 'distributor', 'retailer', 'importer', 'other'],
      default: 'manufacturer',
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
    contactPerson: {
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
      unique: true,
      sparse: true,
      trim: true,
    },
    panNumber: {
      type: String,
      trim: true,
      default: '',
    },
    paymentTerms: {
      type: String,
      enum: ['immediate', 'net_7', 'net_15', 'net_30', 'net_60', 'net_90', 'custom'],
      default: 'net_30',
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      branchName: { type: String, default: '' },
    },

    // === Operational ===
    notes: {
      type: String,
      default: '',
    },
    outstandingPayments: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalPurchaseAmount: {
      type: Number,
      default: 0,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
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

supplierSchema.index({ name: 'text', companyName: 'text', email: 'text', contactPerson: 'text' });
supplierSchema.index({ email: 1 });
supplierSchema.index({ isActive: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
