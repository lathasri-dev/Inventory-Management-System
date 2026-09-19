const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE_IDS } = require('../utils/roles');

router.use(authenticate);
router.use(authorize([ROLE_IDS.ADMIN]));

router.get('/', activityLogController.getActivityLogs);

module.exports = router;
