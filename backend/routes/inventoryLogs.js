const express = require('express');
const router = express.Router();
const inventoryLogController = require('../controllers/inventoryLogController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE_IDS } = require('../utils/roles');

// All inventory log routes require authentication
router.use(authenticate);

// Get list of inventory logs
router.get('/', inventoryLogController.getInventoryLogs);

// Perform a manual stock adjustment
router.post('/adjustment', authorize([ROLE_IDS.ADMIN, ROLE_IDS.MANAGER, ROLE_IDS.USER]), inventoryLogController.createAdjustment);

module.exports = router;
