const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE_IDS } = require('../utils/roles');

router.use(authenticate);

router.get('/', salesController.getSales);
router.get('/:id', salesController.getSaleById);
router.post('/', authorize([ROLE_IDS.ADMIN, ROLE_IDS.MANAGER, ROLE_IDS.USER]), salesController.createSale);
router.delete('/:id', authorize([ROLE_IDS.ADMIN, ROLE_IDS.MANAGER]), salesController.deleteSale);

module.exports = router;
