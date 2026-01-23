/**
 * Route Configuration
 * Centralized route initialization and registration
 */

const errorLogger = require('../utils/errorLogger');

/**
 * Initialize and register all application routes
 * @param {Express} app - Express application instance
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {object} middleware - Middleware functions
 * @param {object} services - Service functions (createNotification, sendEmail, etc.)
 * @param {object} guards - Guard functions (idempotencyGuard, etc.)
 */
function setupRoutes(app, pool, middleware, services, guards) {
  const {
    authenticateToken,
    generalLimiter,
    authLimiter,
    offerSpeedLimiter,
    messageSpeedLimiter,
  } = middleware;

  const {
    createNotification,
    sendEmail,
    writeAuditLog,
  } = services;

  const {
    idempotencyGuard,
    upload,
    requireAdmin,
  } = guards;

  // Import route factories
  const createAuthRoutes = require('../routes/v1/auth');
  const createShipmentRoutes = require('../routes/v1/shipments');
  const createMessageRoutes = require('../routes/v1/messages');
  const createOfferRoutes = require('../routes/v1/offers');
  const createDashboardRoutes = require('../routes/v1/dashboard');
  const createNotificationRoutes = require('../routes/v1/notifications');
  const createHealthRoutes = require('../routes/v1/health');
  const createRatingsRoutes = require('../routes/v1/ratings');
  const createUsersRoutes = require('../routes/v1/users');
  const createVehiclesRoutes = require('../routes/v1/vehicles');
  const createLoadsRoutes = require('../routes/v1/loads');
  const createCarrierRoutes = require('../routes/v1/carriers');
  const createDriversRoutes = require('../routes/v1/drivers');
  const createKvkkRoutes = require('../routes/v1/kvkk');
  const createReportsRoutes = require('../routes/v1/reports');
  const createLogsRoutes = require('../routes/v1/logs');
  const createComplaintsRoutes = require('../routes/v1/complaints');
  const createAgreementsRoutes = require('../routes/v1/agreements');
  const createWalletRoutes = require('../routes/v1/wallet');
  const createAdminRoutes = require('../routes/v1/admin');
  const createCarrierMarketRoutes = require('../routes/v1/carrierMarket');
  const createDisputeRoutes = require('../routes/v1/disputes');
  const createSuspiciousActivityRoutes = require('../routes/v1/suspicious-activity');
  const createFinancialTransparencyRoutes = require('../routes/v1/financial-transparency');
  const createAdminNotificationRoutes = require('../routes/v1/admin-notifications');
  const createAdminBulkOperationsRoutes = require('../routes/v1/admin-bulk-operations');
  const createSupportRoutes = require('../routes/v1/support');
  const createAdminSupportRoutes = require('../routes/v1/admin-support');
  const createAuditTrailRoutes = require('../routes/v1/audit-trail');

  // Create route instances
  const jwtSecret = process.env.JWT_SECRET || '';
  const authRoutes = createAuthRoutes(pool, jwtSecret, createNotification, sendEmail);
  const shipmentRoutes = createShipmentRoutes(pool, authenticateToken, createNotification, idempotencyGuard);
  const messageRoutes = createMessageRoutes(pool, authenticateToken, createNotification, writeAuditLog, messageSpeedLimiter, idempotencyGuard, generalLimiter, upload);
  const offerRoutes = createOfferRoutes(pool, authenticateToken, createNotification, sendEmail, writeAuditLog, offerSpeedLimiter, idempotencyGuard);
  const dashboardRoutes = createDashboardRoutes(pool, authenticateToken);
  const notificationRoutes = createNotificationRoutes(pool, authenticateToken);
  const healthRoutes = createHealthRoutes(pool);
  const ratingsRoutes = createRatingsRoutes(pool, authenticateToken);
  const usersRoutes = createUsersRoutes(pool, authenticateToken);
  const vehiclesRoutes = createVehiclesRoutes(pool, authenticateToken);
  const loadsRoutes = createLoadsRoutes(pool, authenticateToken);
  const carriersRoutes = createCarrierRoutes(pool, authenticateToken);
  const driversRoutes = createDriversRoutes(pool, authenticateToken);
  const kvkkRoutes = createKvkkRoutes(pool, authenticateToken);
  const reportsRoutes = createReportsRoutes(pool, authenticateToken);
  const logsRoutes = createLogsRoutes(pool, authenticateToken);
  const complaintsRoutes = createComplaintsRoutes(pool, authenticateToken, upload);
  const agreementsRoutes = createAgreementsRoutes(pool, authenticateToken);
  const walletRoutes = createWalletRoutes(pool, authenticateToken);
  const adminRoutes = createAdminRoutes(pool, authenticateToken, requireAdmin, writeAuditLog);
  const carrierMarketRoutes = createCarrierMarketRoutes(pool, authenticateToken, createNotification);
  const disputeRoutes = createDisputeRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification);
  const suspiciousActivityRoutes = createSuspiciousActivityRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification);
  const financialTransparencyRoutes = createFinancialTransparencyRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification);
  const adminNotificationRoutes = createAdminNotificationRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification);
  const adminBulkOperationsRoutes = createAdminBulkOperationsRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification);
  const supportRoutes = createSupportRoutes(pool, authenticateToken);
  const adminSupportRoutes = createAdminSupportRoutes(pool, authenticateToken, requireAdmin);
  const auditTrailRoutes = createAuditTrailRoutes(pool, authenticateToken, requireAdmin);

  // Register routes with rate limiting
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/shipments', generalLimiter, shipmentRoutes);
  app.use('/api/messages', generalLimiter, messageRoutes);
  app.use('/api/offers', generalLimiter, offerRoutes);
  app.use('/api/dashboard', generalLimiter, dashboardRoutes);
  app.use('/api/notifications', generalLimiter, notificationRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/ratings', generalLimiter, ratingsRoutes);
  app.use('/api/users', generalLimiter, usersRoutes);
  app.use('/api/vehicles', generalLimiter, vehiclesRoutes);
  app.use('/api/loads', generalLimiter, loadsRoutes);
  app.use('/api/carriers', generalLimiter, carriersRoutes);
  app.use('/api/drivers', generalLimiter, driversRoutes);
  app.use('/api/kvkk', generalLimiter, kvkkRoutes);
  app.use('/api/reports', generalLimiter, reportsRoutes);
  app.use('/api/logs', generalLimiter, logsRoutes);
  app.use('/api/complaints', generalLimiter, complaintsRoutes);
  app.use('/api/agreements', generalLimiter, agreementsRoutes);
  app.use('/api/wallet', generalLimiter, walletRoutes);
  app.use('/api/admin', generalLimiter, adminRoutes);
  app.use('/api/carrier-market', generalLimiter, carrierMarketRoutes);
  app.use('/api/disputes', generalLimiter, disputeRoutes);
  app.use('/api/suspicious-activity', generalLimiter, suspiciousActivityRoutes);
  app.use('/api/financial-transparency', generalLimiter, financialTransparencyRoutes);
  app.use('/api/admin-notifications', generalLimiter, adminNotificationRoutes);
  app.use('/api/admin-bulk-operations', generalLimiter, adminBulkOperationsRoutes);
  app.use('/api/support', generalLimiter, supportRoutes);
  app.use('/api/admin-support', generalLimiter, adminSupportRoutes);
  app.use('/api/audit-trail', generalLimiter, auditTrailRoutes);

  errorLogger.info('All routes registered successfully');
}

module.exports = { setupRoutes };
