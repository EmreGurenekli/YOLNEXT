/**
 * Routes Index
 * Centralized route registration
 * 
 * This file organizes all routes and registers them with Express app
 */

const express = require('express');
const router = express.Router();

/**
 * Register all routes
 * Routes are organized by feature/domain
 */
const registerRoutes = (app, pool, authenticateToken) => {
  // Health check routes (no auth required)
  try {
    const healthRoutes = require('./health');
    app.use('/health', healthRoutes);
    app.use('/api/health', healthRoutes);
  } catch (error) {
    console.warn('Health routes not available:', error.message);
  }

  // Auth routes (rate limited, no auth required for register/login)
  try {
    const authRoutes = require('./auth');
    app.use('/api/auth', authRoutes);
  } catch (error) {
    console.warn('Auth routes not available:', error.message);
  }

  // Dashboard routes (require auth)
  try {
    const dashboardRoutes = require('./dashboard');
    app.use('/api/dashboard', dashboardRoutes);
  } catch (error) {
    console.warn('Dashboard routes not available:', error.message);
  }

  // Shipment routes (require auth)
  try {
    const shipmentRoutes = require('./shipments');
    app.use('/api/shipments', shipmentRoutes);
  } catch (error) {
    console.warn('Shipment routes not available:', error.message);
  }

  // Offer routes (require auth)
  try {
    const offerRoutes = require('./offers-fixed');
    app.use('/api/offers', offerRoutes);
  } catch (error) {
    console.warn('Offer routes not available:', error.message);
  }

  // Message routes (require auth)
  try {
    const messageRoutes = require('./real-messaging');
    app.use('/api/messages', messageRoutes);
  } catch (error) {
    console.warn('Message routes not available:', error.message);
  }

  // Notification routes (require auth)
  try {
    const notificationRoutes = require('./notifications');
    app.use('/api/notifications', notificationRoutes);
  } catch (error) {
    console.warn('Notification routes not available:', error.message);
  }

  // User routes (require auth)
  try {
    const userRoutes = require('./users');
    app.use('/api/users', userRoutes);
  } catch (error) {
    console.warn('User routes not available:', error.message);
  }

  // Wallet routes (require auth)
  try {
    const walletRoutes = require('./wallet');
    app.use('/api/wallet', walletRoutes);
  } catch (error) {
    console.warn('Wallet routes not available:', error.message);
  }

  // Analytics routes (require auth)
  try {
    const analyticsRoutes = require('./analytics');
    app.use('/api/analytics', analyticsRoutes);
  } catch (error) {
    console.warn('Analytics routes not available:', error.message);
  }

  // Reports routes (require auth)
  try {
    const reportsRoutes = require('./reports');
    app.use('/api/reports', reportsRoutes);
  } catch (error) {
    console.warn('Reports routes not available:', error.message);
  }
};

module.exports = { registerRoutes };

































