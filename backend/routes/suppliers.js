const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE_IDS } = require('../utils/roles');

router.use(authenticate);

// Collection routes
router.get('/', supplierController.getSuppliers);
router.post(
  '/',
  authorize([ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER]),
  supplierController.createSupplier
);

// Sub-resource routes (before /:id)
router.get('/:id/products', supplierController.getSupplierProducts);

// Single-resource routes
router.get('/:id', supplierController.getSupplierById);
router.put(
  '/:id',
  authorize([ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER]),
  supplierController.updateSupplier
);
router.delete(
  '/:id',
  authorize([ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER]),
  supplierController.deleteSupplier
);

module.exports = router;
