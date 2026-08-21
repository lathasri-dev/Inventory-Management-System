const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');

exports.getInventoryReport = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).populate('category', 'name').populate('supplier', 'name');
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.getSalesReport = async (req, res) => {
  try {
    const sales = await Sale.find({ isActive: true }).populate('customer', 'name email').populate('items.product', 'name sku');
    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.getRevenueReport = async (req, res) => {
  try {
    const summary = await Sale.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          salesCount: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, data: summary[0] || { revenue: 0, salesCount: 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.getSupplierReport = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).populate('products', 'name sku');
    res.json({ success: true, data: suppliers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.getCustomerReport = async (req, res) => {
  try {
    const customers = await Customer.find({ isActive: true }).sort({ totalSpent: -1 });
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
