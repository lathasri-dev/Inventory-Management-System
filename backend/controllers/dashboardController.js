const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

exports.getStats = async (req, res) => {
  try {
    const [
      totalProducts,
      totalCategories,
      lowStockProducts,
      outOfStockProducts,
      totalSuppliers,
      totalCustomers,
      todaySales,
      monthlySales,
      pendingOrders,
      purchaseOrders,
      expiringSoonProducts,
      totalInventoryValRes,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, $expr: { $lte: ['$quantity', '$reorderLevel'] }, quantity: { $gt: 0 } }),
      Product.countDocuments({ isActive: true, quantity: 0 }),
      Supplier.countDocuments({ isActive: true }),
      Customer.countDocuments({ isActive: true }),
      Sale.aggregate([
        { $match: { isActive: true, createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Sale.aggregate([
        { $match: { isActive: true, createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Sale.countDocuments({ isActive: true, paymentStatus: 'pending' }),
      Purchase.countDocuments(),
      Product.countDocuments({ isActive: true, expiryDate: { $gte: new Date(), $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ['$price', '$quantity'] } } } },
      ]),
    ]);

    const recentActivities = await ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'fullName email role');
    const recentNotifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10);
    const topSellingProducts = await Sale.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        totalCategories,
        lowStockProducts,
        outOfStockProducts,
        totalSuppliers,
        totalCustomers,
        todaySales: todaySales[0]?.total || 0,
        monthlyRevenue: monthlySales[0]?.total || 0,
        pendingOrders,
        purchaseOrders,
        expiringSoonProducts,
        totalInventoryValue: totalInventoryValRes[0]?.totalValue || 0,
        recentActivities,
        recentNotifications,
        topSellingProducts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};