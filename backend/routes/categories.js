const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE_IDS } = require('../utils/roles');

router.use(authenticate);

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', authorize([ROLE_IDS.ADMIN, ROLE_IDS.MANAGER]), categoryController.createCategory);
router.put('/:id', authorize([ROLE_IDS.ADMIN, ROLE_IDS.MANAGER]), categoryController.updateCategory);
router.delete('/:id', authorize([ROLE_IDS.ADMIN, ROLE_IDS.MANAGER]), categoryController.deleteCategory);

module.exports = router;
