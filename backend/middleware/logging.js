const logger = require('../utils/logger');

/**
 * Activity logger middleware
 * Logs user actions for audit trail
 */
const activityLogger = (req, res, next) => {
  if (req.user) {
    const activity = {
      userId: req.user.id,
      username: req.user.email,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    };

    logger.debug('User activity', activity);
  }

  next();
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};

module.exports = {
  activityLogger,
  requestLogger,
};
