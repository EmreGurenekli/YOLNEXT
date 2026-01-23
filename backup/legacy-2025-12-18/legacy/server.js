const express = require('express');
const cors = require('cors');
const path = require('path');
// const logger = require('./utils/logger'); // Temporarily disabled

// Routes
const verificationRoutes = require('./routes/simple-verification');
const shipmentRoutes = require('./routes/shipments');
const offersRoutes = require('./routes/offers-fixed');

const app = express();
const PORT = process.env.PORT || 3002; // Changed port to 3002

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logging middleware
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`
  );
  next();
});

// Routes
app.use('/api/verify', verificationRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/offers', offersRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server started on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Shipments API: http://localhost:${PORT}/api/shipments`);
  console.log(`🔍 Verification API: http://localhost:${PORT}/api/verify`);
  console.log(`✅ Backend tamamen çalışır durumda!`);
});

module.exports = app;