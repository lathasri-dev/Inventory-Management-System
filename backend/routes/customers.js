const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE_IDS } = require('../utils/roles');

router.use(authenticate);

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.get('/:id/sales', customerController.getCustomerSales);
router.post('/', authorize([ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER, ROLE_IDS.SALES_STAFF]), customerController.createCustomer);
router.put('/:id', authorize([ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER, ROLE_IDS.SALES_STAFF]), customerController.updateCustomer);
router.delete('/:id', authorize([ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER]), customerController.deleteCustomer);

module.exports = router;