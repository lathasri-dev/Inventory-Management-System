const rateLimit = require('express-rate-limit');

// Helper to determine if we are in development/test environment
const isDevOrTest = () => {
  const env = (process.env.NODE_ENV || 'development').trim().toLowerCase();
  return env === 'development' || env === 'test';
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevOrTest(),
});

/**
 * Auth rate limiter
 * 5 requests per 15 minutes for login/register
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
  skip: () => isDevOrTest(),
});

/**
 * Strict rate limiter for critical operations
 * 3 requests per 15 minutes
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many requests for this operation',
  skip: () => isDevOrTest(),
});

module.exports = {
  apiLimiter,
  authLimiter,
  strictLimiter,
};

