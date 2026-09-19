const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE_IDS } = require('../utils/roles');

router.use(authenticate);
router.use(authorize([ROLE_IDS.ADMIN]));

router.get('/', userController.getUsers);
router.put('/:id/role', userController.updateUserRole);
router.put('/:id/status', userController.toggleUserStatus);
router.delete('/:id', userController.deleteUser);

module.exports = router;
