const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { ROLE_IDS } = require('../utils/roles');

const logActivity = async (req, action, resourceId, changes = {}) => {
  try {
    if (req.user) {
      await ActivityLog.create({
        user: req.user.id,
        action,
        module: 'users',
        resourceId,
        resourceType: 'User',
        changes,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
      });
    }
  } catch (error) {
    console.error('User activity logging failed:', error.message);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private (Admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !Object.values(ROLE_IDS).includes(role)) {
      return res.status(400).json({ success: false, message: 'Valid role is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent de-promoting oneself to avoid lockout issues
    if (req.user.id === user.id && role !== ROLE_IDS.ADMIN && role !== ROLE_IDS.SUPER_ADMIN) {
      return res.status(400).json({ success: false, message: 'You cannot change your own admin role' });
    }

    const beforeState = { role: user.role };
    user.role = role;
    await user.save();

    await logActivity(req, 'UPDATE_USER_ROLE', user._id, { before: beforeState, after: { role: user.role } });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Toggle user status (Active/Disabled)
// @route   PUT /api/users/:id/status
// @access  Private (Admin only)
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deactivating self
    if (req.user.id === user.id) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    const beforeState = { isActive: user.isActive };
    user.isActive = !user.isActive;
    await user.save();

    await logActivity(req, 'TOGGLE_USER_STATUS', user._id, { before: beforeState, after: { isActive: user.isActive } });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user.id === user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);

    await logActivity(req, 'DELETE_USER', user._id, { deletedUser: user.email });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
