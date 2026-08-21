const InventoryLog = require('../models/InventoryLog');
const Product = require('../models/Product');

// @desc    Get all inventory logs (with filter & pagination)
// @route   GET /api/inventory-logs
// @access  Private
exports.getInventoryLogs = async (req, res) => {
  try {
    const { product, type, page = 1, limit = 20, startDate, endDate } = req.query;

    const query = {};

    if (product) {
      query.product = product;
    }
    if (type) {
      query.type = type;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const logs = await InventoryLog.find(query)
      .populate('product', 'name sku barcode unit price')
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await InventoryLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Create manual inventory adjustment (Stock In, Stock Out, Damaged, Returned, Transfer)
// @route   POST /api/inventory-logs/adjustment
// @access  Private (Admin, Inventory Manager, Sales Staff)
exports.createAdjustment = async (req, res) => {
  try {
    const { productId, type, quantity, notes, warehouseLocation } = req.body;

    if (!productId || !type || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Product ID, adjustment type, and quantity are required' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty === 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a non-zero integer' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = product.quantity;
    let newStock = previousStock;

    // Evaluate stock change direction
    if (type === 'stock_in' || type === 'returned') {
      newStock += Math.abs(qty);
    } else if (type === 'stock_out' || type === 'damaged') {
      newStock -= Math.abs(qty);
    } else if (type === 'adjustment') {
      newStock += qty; // Allow raw signed math
    } else if (type === 'transfer') {
      newStock -= qty; // Outward local transfer
    } else {
      return res.status(400).json({ success: false, message: 'Invalid adjustment type' });
    }

    if (newStock < 0) {
      return res.status(400).json({ success: false, message: 'Adjustment results in negative stock' });
    }

    product.quantity = newStock;

    // Automatically recalculate status
    if (newStock === 0) {
      product.status = 'out_of_stock';
    } else if (newStock <= product.reorderLevel) {
      product.status = 'low_stock';
    } else {
      product.status = 'active';
    }

    await product.save();

    const log = await InventoryLog.create({
      product: product._id,
      user: req.user.id,
      type,
      quantity: qty,
      previousStock,
      newStock,
      warehouseLocation,
      notes,
    });

    res.status(201).json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
