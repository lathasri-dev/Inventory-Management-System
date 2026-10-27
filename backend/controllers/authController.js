const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { ROLE_IDS, normalizeRole } = require('../utils/roles');
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
  const { fullName, email, password, phone, role, securityQuestion, securityAnswer } = req.body;

  // Validate input
  if (!fullName || !email || !password || !phone) {
    throw new APIError('Full name, email, password, and phone number are required', 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new APIError('User already registered with this email', 409);
  }

  const finalSecurityQuestion = securityQuestion || 'What was the name of your first school?';
  const finalSecurityAnswer = (securityAnswer || 'school').trim().toLowerCase();
  const securityAnswerHash = await bcrypt.hash(finalSecurityAnswer, 12);

  const recoveryCode = crypto.randomBytes(32).toString('hex');
  const recoveryCodeHash = crypto.createHash('sha256').update(recoveryCode).digest('hex');

  // Create new user
  const user = new User({
    fullName,
    email: email.toLowerCase(),
    password,
    phone,
    role: role || ROLE_IDS.USER,
    securityQuestion: finalSecurityQuestion,
    securityAnswerHash,
    recoveryCodeHash,
  });

  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  await user.save();

  try {
    await sendMail({
      to: user.email,
      subject: 'Verify your email',
      text: `Verify your email with this token: ${verificationToken}`,
      html: `<p>Verify your email using this token:</p><p><b>${verificationToken}</b></p>`,
    });
  } catch (error) {
    logger.warn(`Failed to send verification email to ${user.email}. SMTP might not be configured.`);
  }

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
      recoveryCode,
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
    throw new APIError('Account does not exist. Please create an account.', 404);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new APIError('Invalid email or password', 401);
  }

  // Strict Role Validation (if role was selected/sent)
  if (req.body.role) {
    const requestedRole = normalizeRole(req.body.role);
    if (user.role !== requestedRole) {
      throw new APIError('Invalid role. Please select the role associated with your account.', 403);
    }
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

exports.setupSecurity = asyncHandler(async (req, res) => {
  const { currentPassword, securityQuestion, securityAnswer } = req.body;
  
  if (!currentPassword || !securityQuestion || !securityAnswer) {
    throw new APIError('Current password, security question, and answer are required', 400);
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    throw new APIError('User not found', 404);
  }

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new APIError('Current password is incorrect', 401);
  }

  const recoveryCode = crypto.randomBytes(32).toString('hex');
  const recoveryCodeHash = crypto.createHash('sha256').update(recoveryCode).digest('hex');

  const normalizedAnswer = securityAnswer.trim().toLowerCase();
  const hashedAnswer = await bcrypt.hash(normalizedAnswer, 12);

  user.securityQuestion = securityQuestion;
  user.securityAnswerHash = hashedAnswer;
  user.recoveryCodeHash = recoveryCodeHash;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Security recovery configured successfully. Save this recovery code securely!',
    data: {
      recoveryCode,
    },
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new APIError('Email is required', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  
  const question = (user && user.securityQuestion) 
    ? user.securityQuestion 
    : "What was the name of your first school?";

  res.status(200).json({
    success: true,
    message: 'If an account exists for this email, please answer your security question.',
    data: {
      securityQuestion: question,
    },
  });
});

exports.verifyRecovery = asyncHandler(async (req, res) => {
  const { email, recoveryCode, securityAnswer } = req.body;

  if (!email || !recoveryCode || !securityAnswer) {
    throw new APIError('Email, recovery code, and security answer are required', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+securityAnswerHash +recoveryCodeHash');
  
  if (!user) {
    throw new APIError('Invalid recovery credentials.', 400);
  }

  if (user.recoveryLockedUntil && user.recoveryLockedUntil > Date.now()) {
    throw new APIError('Recovery locked due to too many failed attempts. Try again later.', 403);
  }

  const normalizedAnswer = securityAnswer.trim().toLowerCase();
  let isValidAnswer = false;
  let isValidCode = false;

  if (user.securityAnswerHash) {
    isValidAnswer = await bcrypt.compare(normalizedAnswer, user.securityAnswerHash);
  }

  if (user.recoveryCodeHash) {
    const inputHash = crypto.createHash('sha256').update(recoveryCode.trim()).digest('hex');
    isValidCode = (inputHash === user.recoveryCodeHash);
  }

  console.log('isValidAnswer:', isValidAnswer, 'isValidCode:', isValidCode);

  if (!isValidAnswer || !isValidCode) {
    user.recoveryAttempts = (user.recoveryAttempts || 0) + 1;
    if (user.recoveryAttempts >= 5) {
      user.recoveryLockedUntil = Date.now() + 15 * 60 * 1000;
    }
    await user.save();
    throw new APIError(`Invalid recovery credentials. A: ${isValidAnswer} C: ${isValidCode}`, 400);
  }

  user.recoveryAttempts = 0;
  user.recoveryLockedUntil = undefined;
  
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Recovery verified.',
    data: {
      resetToken,
    },
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    throw new APIError('Password and confirm password are required', 400);
  }

  if (password !== confirmPassword) {
    throw new APIError('Passwords do not match', 400);
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new APIError('Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.', 400);
  }

  const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    throw new APIError('This password reset link is invalid or has expired.', 400);
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
