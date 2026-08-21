const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE_IDS } = require('../utils/roles');

// All settings routes require authentication
router.use(authenticate);

// Get settings
router.get('/', settingsController.getSettings);

// Update settings (Admins only)
router.put('/', authorize([ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN]), settingsController.updateSettings);

// Trigger a database backup (Admins only)
router.get('/backup', authorize([ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN]), settingsController.backupDatabase);

module.exports = router;
