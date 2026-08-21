const User = require('../models/User');
const { ROLE_IDS } = require('../utils/roles');
const crypto = require('crypto');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');
const { APIError, asyncHandler } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { sendMail } = require('../services/mailer');

/**
 * Register a new user
 */
exports.register = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, role } = req.body;

  // Validate input
  if (!fullName || !email || !password || !phone) {
    throw new APIError('All fields are required', 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new APIError('User already registered with this email', 409);
  }

  // Create new user
  const user = new User({
    fullName,
    email: email.toLowerCase(),
    password,
    phone,
    role: role || ROLE_IDS.VIEWER,
  });

  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  await user.save();

  await sendMail({
    to: user.email,
    subject: 'Verify your email',
    text: `Verify your email with this token: ${verificationToken}`,
    html: `<p>Verify your email using this token:</p><p><b>${verificationToken}</b></p>`,
  });

  // Generate tokens
  const payload = { id: user._id, email: user.email, role: user.role };
  const token = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Log activity
  logger.info(`New user registered: ${email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toJSON(),
      token,
      refreshToken,
    },
  });
});

/**
 * Login user
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new APIError('Email and password are required', 400);
  }

  // Find user and check password
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password'
  );
  if (!user) {
    throw new APIError('Invalid email or password', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new APIError('Invalid email or password', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new APIError('User account is disabled', 403);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const payload = { id: user._id, email: user.email, role: user.role };
  const token = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  logger.info(`User logged in: ${email}`);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      token,
      refreshToken,
    },
  });
});

/**
 * Refresh access token using refresh token
 */
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new APIError('Refresh token is required', 400);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new APIError('User not found or inactive', 401);
    }

    const payload = { id: user._id, email: user.email, role: user.role };
    const newToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    throw new APIError('Invalid refresh token', 401);
  }
});

/**
 * Get current user
 */
exports.getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new APIError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { user: user.toJSON() },
  });
});

/**
 * Logout user
 */
exports.logout = asyncHandler(async (req, res) => {
  logger.info(`User logged out: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Update user profile
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new APIError('User not found', 404);
  }

  if (fullName) user.fullName = fullName;
  if (phone) user.phone = phone;

  await user.save();

  logger.info(`User profile updated: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: user.toJSON() },
  });
});

/**
 * Change password
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new APIError('Current and new passwords are required', 400);
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    throw new APIError('User not found', 404);
  }

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new APIError('Current password is incorrect', 401);
  }

  user.password = newPassword;
  await user.save();

  logger.info(`User changed password: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new APIError('Email is required', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new APIError('User not found', 404);
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  await user.save();

  await sendMail({
    to: user.email,
    subject: 'Password reset request',
    text: `Reset your password using this token: ${resetToken}`,
    html: `<p>Reset your password using this token:</p><p><b>${resetToken}</b></p>`,
  });

  res.status(200).json({
    success: true,
    message: 'Password reset instructions sent to your email',
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new APIError('Password is required', 400);
  }

  const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    throw new APIError('Invalid or expired reset token', 400);
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
  });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new APIError('Invalid or expired verification token', 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
  });
});

exports.resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new APIError('Email is required', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new APIError('User not found', 404);
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  await sendMail({
    to: user.email,
    subject: 'Verify your email',
    text: `Verify your email with this token: ${verificationToken}`,
    html: `<p>Verify your email using this token:</p><p><b>${verificationToken}</b></p>`,
  });

  res.status(200).json({
    success: true,
    message: 'Verification email sent',
  });
});
