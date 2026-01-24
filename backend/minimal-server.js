/**
 * ULTRA MINIMAL SERVER - CRASH PREVENTION
 * Purpose: Get backend running without any complex dependencies
 */

const express = require('express');
const path = require('path');

console.log('🔧 MINIMAL SERVER: Starting...');

const app = express();
const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('🔧 MINIMAL SERVER: Express app created');

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('🔧 MINIMAL SERVER: Basic middleware added');

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

console.log('🔧 MINIMAL SERVER: CORS configured');

// Serve static files (frontend)
if (NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../dist');
  console.log('🔧 MINIMAL SERVER: Static path:', staticPath);
  app.use(express.static(staticPath));
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MINIMAL SERVER is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0-minimal'
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'YOLNEXT Backend',
    mode: 'ULTRA_MINIMAL',
    features: ['health_check', 'static_files', 'cors'],
    database: 'DISABLED',
    authentication: 'DISABLED'
  });
});

// Catch all for frontend
if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    try {
      const indexPath = path.resolve(__dirname, '../dist', 'index.html');
      console.log('🔧 MINIMAL SERVER: Serving frontend for:', req.path, 'from:', indexPath);
      res.sendFile(indexPath);
    } catch (error) {
      console.error('❌ MINIMAL SERVER: Frontend serve error:', error.message);
      res.status(404).json({ error: 'Frontend not available', path: req.path });
    }
  });
}

console.log('🔧 MINIMAL SERVER: Routes configured');

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ MINIMAL SERVER ERROR:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('✅ MINIMAL SERVER RUNNING:', {
    port: PORT,
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    pid: process.pid
  });
});

server.on('error', (err) => {
  console.error('❌ MINIMAL SERVER STARTUP ERROR:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔧 MINIMAL SERVER: Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✅ MINIMAL SERVER: Process terminated');
    process.exit(0);
  });
});

console.log('✅ MINIMAL SERVER: Startup complete');