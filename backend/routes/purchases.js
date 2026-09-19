const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE_IDS } = require('../utils/roles');

router.use(authenticate);

router.get('/', purchaseController.getPurchases);
router.post('/', authorize([ROLE_IDS.ADMIN, ROLE_IDS.MANAGER, ROLE_IDS.USER]), purchaseController.createPurchase);

module.exports = router;
