const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

// @desc    Perform global search across products, categories, suppliers, customers, and sales
// @route   GET /api/search
// @access  Private
exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.json({
        success: true,
        data: { products: [], categories: [], suppliers: [], customers: [], orders: [] },
      });
    }

    const searchRegex = new RegExp(q, 'i');

    const [products, categories, suppliers, customers, sales] = await Promise.all([
      Product.find({
        isActive: true,
        $or: [{ name: searchRegex }, { sku: searchRegex }, { barcode: searchRegex }],
      }).limit(5).populate('category', 'name'),
      Category.find({
        isActive: true,
        name: searchRegex,
      }).limit(5),
      Supplier.find({
        isActive: true,
        $or: [{ name: searchRegex }, { companyName: searchRegex }, { email: searchRegex }],
      }).limit(5),
      Customer.find({
        isActive: true,
        $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }],
      }).limit(5),
      Sale.find({
        isActive: true,
        saleNumber: searchRegex,
      }).limit(5).populate('customer', 'name'),
    ]);

    res.json({
      success: true,
      data: {
        products,
        categories,
        suppliers,
        customers,
        orders: sales,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
