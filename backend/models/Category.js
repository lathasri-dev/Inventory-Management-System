const mongoose = require('mongoose');

/**
 * Category Schema
 * Product categories with display metadata
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    color: {
      // Hex color for UI display (e.g. "#4CAF50")
      type: String,
      default: '#1976d2',
      trim: true,
    },
    icon: {
      // Material icon name string (e.g. "inventory", "devices", "local_dining")
      type: String,
      default: 'category',
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
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

categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);
