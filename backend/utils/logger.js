const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

/**
 * Format log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {string} Formatted log message
 */
const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    ...meta,
  };
  return JSON.stringify(logData);
};

/**
 * Write log to file
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const writeLog = (level, message, meta = {}) => {
  const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
  const logEntry = formatLog(level, message, meta) + '\n';
  fs.appendFileSync(logFile, logEntry);
};

/**
 * Logger object with methods for different log levels
 */
const logger = {
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${message}`, meta);
    writeLog(LOG_LEVELS.ERROR, message, meta);
  },

  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, meta);
    writeLog(LOG_LEVELS.WARN, message, meta);
  },

  info: (message, meta = {}) => {
    console.info(`[INFO] ${message}`, meta);
    writeLog(LOG_LEVELS.INFO, message, meta);
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, meta);
      writeLog(LOG_LEVELS.DEBUG, message, meta);
    }
  },
};

module.exports = logger;
