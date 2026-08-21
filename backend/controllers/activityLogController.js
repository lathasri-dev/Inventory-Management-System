const ActivityLog = require('../models/ActivityLog');

// @desc    Get all activity logs (paginated, with search & filtering)
// @route   GET /api/activity-logs
// @access  Private (Admin, Super Admin)
exports.getActivityLogs = async (req, res) => {
  try {
    const { user, module: mod, action, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};

    if (user) {
      query.user = user;
    }
    if (mod) {
      query.module = mod;
    }
    if (action) {
      query.action = new RegExp(action, 'i');
    }
    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const logs = await ActivityLog.find(query)
      .populate('user', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await ActivityLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
