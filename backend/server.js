const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Security middleware
const {
  generalLimiter,
  authLimiter,
  apiLimiter,
  shipmentLimiter,
  offerLimiter,
  speedLimiter,
  securityHeaders,
  requestLogger,
  suspiciousActivityDetection
} = require('./middleware/security');

// Advanced Security & Monitoring
const {
  advancedSecurityHeaders,
  checkAdminAccess,
  bruteForceProtection,
  sqlInjectionProtection,
  xssProtection,
  contentModeration,
  requestSizeLimiter,
  advancedRateLimit,
  slowDownProtection
} = require('./middleware/advanced-security');

// Load Balancing
const {
  rateLimitByIP,
  concurrentRequestLimit,
  requestQueue,
  healthCheck
} = require('./middleware/load-balancer');

const {
  performanceMonitoring,
  securityMonitoring,
  apiUsageMonitoring,
  errorTracking,
  uptimeMonitoring,
  databaseHealthMonitoring,
  requestLogging
} = require('./middleware/monitoring');

const {
  googleAnalytics,
  customAnalytics,
  businessMetrics,
  userBehaviorTracking,
  performanceMetrics,
  errorAnalytics
} = require('./middleware/analytics');

const { testConnection, syncDatabase } = require('./models/index');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const shipmentRoutes = require('./routes/shipments');
const offerRoutes = require('./routes/offers');
const carrierRoutes = require('./routes/carriers');
const driverRoutes = require('./routes/drivers');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(securityHeaders);
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: process.env.CORS_CREDENTIALS === 'true'
}));

// Advanced Security Middleware
app.use(advancedSecurityHeaders);
app.use(checkAdminAccess);
app.use(bruteForceProtection);
app.use(sqlInjectionProtection);
app.use(xssProtection);
app.use(contentModeration);
app.use(requestSizeLimiter);
app.use(advancedRateLimit);
app.use(slowDownProtection);

// Load Balancing Middleware
app.use(rateLimitByIP);
app.use(concurrentRequestLimit);
app.use(requestQueue);
app.use(healthCheck);

// Monitoring Middleware
app.use(performanceMonitoring);
app.use(securityMonitoring);
app.use(apiUsageMonitoring);
app.use(uptimeMonitoring);
app.use(databaseHealthMonitoring);
app.use(requestLogging);

// Analytics Middleware
app.use(googleAnalytics);
app.use(customAnalytics);
app.use(businessMetrics);
app.use(userBehaviorTracking);
app.use(performanceMetrics);

// Legacy Security (keeping for compatibility)
app.use(requestLogger);
app.use(suspiciousActivityDetection);
app.use(speedLimiter);
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/shipments', shipmentLimiter, shipmentRoutes);
app.use('/api/offers', offerLimiter, offerRoutes);
app.use('/api/carriers', apiLimiter, carrierRoutes);
app.use('/api/drivers', apiLimiter, driverRoutes);
app.use('/api/messages', apiLimiter, messageRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/payments', apiLimiter, paymentRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Kullanıcı bağlandı: ${socket.id}`);
  
  socket.on('join_room', (room) => {
    socket.join(room);
    logger.info(`Kullanıcı ${socket.id} odaya katıldı: ${room}`);
  });
  
  socket.on('leave_room', (room) => {
    socket.leave(room);
    logger.info(`Kullanıcı ${socket.id} odadan ayrıldı: ${room}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Kullanıcı ayrıldı: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Error handling middleware
app.use(errorTracking);
app.use(errorAnalytics);
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models
    await syncDatabase(true); // Force sync to recreate tables
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 YolNet Backend Server ${PORT} portunda çalışıyor!`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🌐 CORS Origin: ${process.env.CORS_ORIGIN}`);
    });
  } catch (error) {
    logger.error('❌ Server başlatma hatası:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

startServer();

module.exports = { app, server, io };