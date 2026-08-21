const { verifyAccessToken } = require('../utils/jwt');
const { APIError, asyncHandler } = require('../utils/errorHandler');
const { roleMatches, normalizeRole } = require('../utils/roles');

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
const authenticate = asyncHandler((req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new APIError('No token provided', 401);
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyAccessToken(token);
    decoded.role = normalizeRole(decoded.role);
    req.user = decoded;
    next();
  } catch (error) {
    throw new APIError('Invalid or expired token', 401);
  }
});

/**
 * Authorization middleware
 * Checks if user has required roles
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const authorize = (allowedRoles = []) => {
  return asyncHandler((req, res, next) => {
    if (!req.user) {
      throw new APIError('User not authenticated', 401);
    }

    if (!roleMatches(req.user.role, allowedRoles)) {
      throw new APIError('Insufficient permissions', 403);
    }

    next();
  });
};

/**
 * Optional authentication middleware
 * Doesn't require token but sets req.user if provided
 */
const authenticateOptional = asyncHandler((req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    } catch (error) {
      // Token is invalid but we don't throw error as it's optional
      req.user = null;
    }
  }

  next();
});

module.exports = {
  authenticate,
  authorize,
  authenticateOptional,
};
