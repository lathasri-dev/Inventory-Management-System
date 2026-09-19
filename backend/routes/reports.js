const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

// All authenticated users can view reports (read-only)
router.use(authenticate);

router.get('/inventory', reportController.getInventoryReport);
router.get('/sales', reportController.getSalesReport);
router.get('/revenue', reportController.getRevenueReport);
router.get('/suppliers', reportController.getSupplierReport);
router.get('/customers', reportController.getCustomerReport);

module.exports = router;
