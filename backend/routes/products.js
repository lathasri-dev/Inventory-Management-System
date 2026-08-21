const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE_IDS } = require('../utils/roles');

// Apply authentication to all product routes
router.use(authenticate);

/**
 * Products Routes
 * NOTE: Static/specific paths MUST be declared before parameterised paths (/:id)
 * to prevent Express matching them as IDs.
 */

// ── Static sub-resource paths (before /:id) ──────────────────────────────────
router.get('/stock/low', productController.getLowStockProducts);
router.get('/stock/out', productController.getOutOfStockProducts);
router.get('/category/:categoryId', productController.getProductsByCategory);

// Bulk delete — POST before DELETE /:id
router.post(
  '/bulk-delete',
  authorize([ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER]),
  productController.bulkDeleteProducts
);

// ── Collection routes ─────────────────────────────────────────────────────────
router.get('/', productController.getProducts);

router.post(
  '/',
  authorize([ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER]),
  productController.createProduct
);

// ── Single-resource routes (:id) ──────────────────────────────────────────────
router.get('/:id', productController.getProductById);

router.put(
  '/:id',
  authorize([ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER]),
  productController.updateProduct
);

// Adjust stock quantity only (also available to sales staff)
router.patch(
  '/:id/quantity',
  authorize([ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER, ROLE_IDS.SALES_STAFF]),
  productController.updateQuantityOnly
);

router.delete(
  '/:id',
  authorize([ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER]),
  productController.deleteProduct
);

module.exports = router;
