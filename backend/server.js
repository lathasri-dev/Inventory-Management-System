// Import dependencies
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('./config/db');
const logger = require('./utils/logger');
const { errorHandler, asyncHandler } = require('./utils/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { activityLogger, requestLogger } = require('./middleware/logging');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:4173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean));

app.use(
  cors({
    origin: (origin, callback) => {
      // In development or if request has no origin (curl/mobile/local), allow all
      if (!origin || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      if (
        allowedOrigins.has(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  })
);

const sanitizeObject = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeObject);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
      if (key.startsWith('$') || key.includes('.')) {
        return accumulator;
      }

      accumulator[key] = sanitizeObject(nestedValue);
      return accumulator;
    }, {});
  }

  return value;
};

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Sanitization middleware (runs after body parser)
app.use((req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
});

// Logging middleware
app.use(requestLogger);
app.use(activityLogger);

// Rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/', apiLimiter);

// ==================== DATABASE ====================

// Connect to MongoDB
connectDB();

// ==================== ROUTES ====================

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const supplierRoutes = require('./routes/suppliers');
const customerRoutes = require('./routes/customers');
const dashboardRoutes = require('./routes/dashboard');
const salesRoutes = require('./routes/sales');
const purchasesRoutes = require('./routes/purchases');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const inventoryLogRoutes = require('./routes/inventoryLogs');
const searchRoutes = require('./routes/search');
const activityLogsRoutes = require('./routes/activityLogs');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/inventory-logs', inventoryLogRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/activity-logs', activityLogsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Inventory Management Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Inventory Management API v2.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      products: '/api/products',
      customers: '/api/customers',
      dashboard: '/api/dashboard',
      sales: '/api/sales',
      purchases: '/api/purchases',
      notifications: '/api/notifications',
      reports: '/api/reports',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    statusCode: 404,
  });
});

// ==================== ERROR HANDLING ====================

// Global error handler (must be last)
app.use(errorHandler);

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { error: err.message });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', { error: err.message });
  process.exit(1);
});

module.exports = server;
