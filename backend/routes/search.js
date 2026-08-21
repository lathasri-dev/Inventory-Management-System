const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all search routes
router.use(authenticate);

// Global search query
router.get('/', searchController.globalSearch);

module.exports = router;
