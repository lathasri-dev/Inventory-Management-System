const mongoose = require('mongoose');
const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { uploadImage } = require('../services/cloudinary');
const { APIError } = require('../utils/errorHandler');
const { ROLE_IDS } = require('../utils/roles');

/**
 * Log activity helper
 */
const logActivity = async (req, action, resourceId, changes = {}) => {
  try {
    if (req.user) {
      await ActivityLog.create({
        user: req.user.id,
        action,
        module: 'products',
        resourceId,
        resourceType: 'Product',
        changes,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });
    }
  } catch (error) {
    console.error('Activity logging failed:', error.message);
  }
};

/**
 * Check stock levels and generate notifications if needed
 */
const checkStockAlerts = async (product) => {
  try {
    let alertType = null;
    let title = '';
    let message = '';

    if (product.quantity === 0) {
      alertType = 'out_of_stock';
      title = 'Product Out of Stock';
      message = `Product "${product.name}" (${product.sku}) is completely out of stock!`;
    } else if (product.quantity <= product.reorderLevel) {
      alertType = 'low_stock';
      title = 'Low Stock Alert';
      message = `Product "${product.name}" (${product.sku}) is low on stock (${product.quantity} remaining, reorder level is ${product.reorderLevel}).`;
    }

    if (alertType) {
      // Find all Admins and Managers to notify
      const usersToNotify = await User.find({
        role: { $in: [ROLE_IDS.ADMIN, ROLE_IDS.MANAGER] },
      });

      const notifications = usersToNotify.map(user => ({
        user: user._id,
        type: alertType,
        title,
        message,
        relatedData: {
          productId: product._id
        },
        link: '/products',
        isRead: false
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }
  } catch (error) {
    console.error('Stock alert notification failed:', error.message);
  }
};

// @desc    Get all products (with pagination, search, sort, filters)
// @route   GET /api/products
// @access  Private
exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      supplier,
      stockStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isActive: true };

    // Search query (queries Name, SKU, Barcode, or Brand)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    // Filters
    if (category) {
      query.category = category;
    }
    if (supplier) {
      query.supplier = supplier;
    }

    // Stock Status filters
    if (stockStatus === 'low') {
      // quantity <= reorderLevel and quantity > 0
      query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
      query.quantity = { $gt: 0 };
    } else if (stockStatus === 'out') {
      query.quantity = 0;
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Execute queries
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: {
        products,
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

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('supplier', 'name');

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin, Manager)
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      barcode,
      category,
      subCategory,
      brand,
      supplier,
      description,
      price,
      sellingPrice,
      costPrice,
      purchasePrice,
      quantity,
      reorderLevel,
      minimumStock,
      unit,
      image,
      manufacturingDate,
      expiryDate,
      branch,
    } = req.body;

    // SKU and SKU uniqueness check
    if (!sku) {
      return res.status(400).json({ success: false, message: 'SKU is required' });
    }
    const existingSku = await Product.findOne({ sku });
    if (existingSku) {
      return res.status(400).json({ success: false, message: 'A product with this SKU already exists' });
    }

    // Barcode uniqueness check if provided
    if (barcode) {
      const existingBarcode = await Product.findOne({ barcode });
      if (existingBarcode) {
        return res.status(400).json({ success: false, message: 'A product with this barcode already exists' });
      }
    }

    // Handle Image Upload
    let imageUrl = '';
    if (image) {
      imageUrl = await uploadImage(image);
    }

    const product = new Product({
      name,
      sku,
      barcode,
      category,
      subCategory,
      brand,
      supplier,
      description,
      price: parseFloat(price) || parseFloat(sellingPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || parseFloat(price) || 0,
      costPrice: parseFloat(costPrice) || parseFloat(purchasePrice) || 0,
      purchasePrice: parseFloat(purchasePrice) || parseFloat(costPrice) || 0,
      quantity: parseInt(quantity, 10) || 0,
      reorderLevel: parseInt(reorderLevel, 10) || 10,
      minimumStock: parseInt(minimumStock, 10) || parseInt(reorderLevel, 10) || 10,
      unit: unit || 'piece',
      image: imageUrl,
      manufacturingDate,
      expiryDate,
      branch: branch || null,
    });

    await product.save();
    
    // Check for stock alerts
    await checkStockAlerts(product);

    // Audit Log
    await logActivity(req, 'CREATE_PRODUCT', product._id, { after: product });

    // Populate before return
    const populated = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('supplier', 'name');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin, Manager)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const beforeState = JSON.parse(JSON.stringify(product));
    const updates = req.body;

    // Check SKU uniqueness
    if (updates.sku && updates.sku !== product.sku) {
      const existingSku = await Product.findOne({ sku: updates.sku });
      if (existingSku) {
        return res.status(400).json({ success: false, message: 'SKU already in use' });
      }
    }

    // Check Barcode uniqueness
    if (updates.barcode && updates.barcode !== product.barcode) {
      const existingBarcode = await Product.findOne({ barcode: updates.barcode });
      if (existingBarcode) {
        return res.status(400).json({ success: false, message: 'Barcode already in use' });
      }
    }

    // Handle Image Upload
    if (updates.image && updates.image !== product.image) {
      updates.image = await uploadImage(updates.image);
    }

    // Convert inputs
    if (updates.price !== undefined) updates.price = parseFloat(updates.price) || 0;
    if (updates.sellingPrice !== undefined) updates.sellingPrice = parseFloat(updates.sellingPrice) || 0;
    if (updates.costPrice !== undefined) updates.costPrice = parseFloat(updates.costPrice) || 0;
    if (updates.purchasePrice !== undefined) updates.purchasePrice = parseFloat(updates.purchasePrice) || 0;
    if (updates.quantity !== undefined) updates.quantity = parseInt(updates.quantity, 10) || 0;
    if (updates.reorderLevel !== undefined) updates.reorderLevel = parseInt(updates.reorderLevel, 10) || 10;
    if (updates.minimumStock !== undefined) updates.minimumStock = parseInt(updates.minimumStock, 10) || 10;

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        product[key] = updates[key];
      }
    });

    await product.save();

    // Check for stock alerts
    await checkStockAlerts(product);

    // Audit Log
    await logActivity(req, 'UPDATE_PRODUCT', product._id, { before: beforeState, after: product });

    // Populate details
    const populated = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('supplier', 'name');

    res.json({ success: true, data: populated });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Update product stock level (quantity) only
// @route   PATCH /api/products/:id/quantity
// @access  Private (Admin, Manager, Employee)
exports.updateQuantityOnly = async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (quantity === undefined || isNaN(parseInt(quantity, 10)) || parseInt(quantity, 10) < 0) {
      return res.status(400).json({ success: false, message: 'A valid non-negative quantity is required' });
    }

    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const beforeState = { quantity: product.quantity };
    product.quantity = parseInt(quantity, 10);
    await product.save();

    // Check for stock alerts
    await checkStockAlerts(product);

    // Audit Log
    await logActivity(req, 'ADJUST_STOCK', product._id, { before: beforeState, after: { quantity: product.quantity } });

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Delete product (soft delete for enterprise safety)
// @route   DELETE /api/products/:id
// @access  Private (Admin, Manager)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // We do a soft delete to maintain transactional integrity for older sales/purchases
    product.isActive = false;
    await product.save();

    // Audit Log
    await logActivity(req, 'DELETE_PRODUCT', product._id, { before: product });

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Bulk delete products (soft delete)
// @route   POST /api/products/bulk-delete
// @access  Private (Admin, Manager)
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'An array of product IDs is required' });
    }

    // Soft delete multiple products
    await Product.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive: false } }
    );

    // Audit Log
    await logActivity(req, 'BULK_DELETE_PRODUCTS', null, { deletedIds: ids });

    res.json({ success: true, message: `${ids.length} products deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Get low stock products
// @route   GET /api/products/stock/low
// @access  Private
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
      quantity: { $gt: 0 }
    }).populate('category', 'name').populate('supplier', 'name');

    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Get out of stock products
// @route   GET /api/products/stock/out
// @access  Private
exports.getOutOfStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      quantity: 0
    }).populate('category', 'name').populate('supplier', 'name');

    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Private
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.categoryId,
      isActive: true
    }).populate('category', 'name').populate('supplier', 'name');

    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
