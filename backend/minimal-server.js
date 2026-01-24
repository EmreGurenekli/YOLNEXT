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

// Database connection (safe mode - won't crash if fails)
let pool = null;
const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL) {
  console.log('🔧 MINIMAL SERVER: Attempting database connection...');
  try {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 3
    });
    
    // Test connection (async, won't block startup)
    pool.query('SELECT NOW()', (err, result) => {
      if (err) {
        console.error('❌ MINIMAL SERVER: Database connection test failed:', err.message);
        // Don't set pool to null, keep trying
      } else {
        console.log('✅ MINIMAL SERVER: Database connected successfully:', result.rows[0]);
      }
    });
    
    pool.on('error', (err) => {
      console.error('❌ MINIMAL SERVER: Database pool error:', err.message);
      // Don't crash, just log
    });
    
  } catch (error) {
    console.error('❌ MINIMAL SERVER: Database setup failed:', error.message);
    pool = null;
  }
} else {
  console.log('⚠️ MINIMAL SERVER: No DATABASE_URL provided');
}

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
    version: '1.0.0-minimal',
    database: pool ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'YOLNEXT Backend',
    mode: 'MINIMAL_WITH_DB',
    features: ['health_check', 'static_files', 'cors', 'database_connection'],
    database: pool ? 'ENABLED' : 'DISABLED',
    authentication: 'BASIC_DEMO'
  });
});

// Shipments API
app.get('/api/shipments', (req, res) => {
  console.log('🔧 MINIMAL SERVER: Shipments API called');
  
  // Demo shipments data
  const demoShipments = [
    {
      id: 'SHIP001',
      title: 'Ev Eşyası Taşıması',
      fromCity: 'İstanbul',
      toCity: 'Ankara', 
      status: 'in_progress',
      createdAt: '2026-01-20',
      price: 850,
      category: 'ev_tasimasi'
    },
    {
      id: 'SHIP002', 
      title: 'Ofis Taşıması',
      fromCity: 'Ankara',
      toCity: 'İzmir',
      status: 'completed',
      createdAt: '2026-01-18',
      price: 1200,
      category: 'ofis_tasimasi'
    }
  ];
  
  res.json({
    success: true,
    shipments: demoShipments,
    total: demoShipments.length
  });
});

// Offers API  
app.get('/api/offers/individual', (req, res) => {
  console.log('🔧 MINIMAL SERVER: Individual offers API called');
  
  const demoOffers = [
    {
      id: 'OFFER001',
      shipmentId: 'SHIP001',
      carrierName: 'Mehmet Nakliyat',
      price: 800,
      rating: 4.8,
      message: 'Deneyimli ekibimizle güvenli taşıma',
      createdAt: '2026-01-21'
    }
  ];
  
  res.json({
    success: true,
    offers: demoOffers,
    total: demoOffers.length
  });
});

// Basic demo login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔧 MINIMAL SERVER: Login attempt for:', email);
  
  // Demo users (hardcoded for now)
  const demoUsers = {
    'demo@bireysel.com': { 
      id: 'demo-individual-001', 
      role: 'individual', 
      name: 'Demo Bireysel', 
      password: '123456' 
    },
    'demo@kurumsal.com': { 
      id: 'demo-corporate-001', 
      role: 'corporate', 
      name: 'Demo Kurumsal', 
      password: '123456' 
    }
  };
  
  const user = demoUsers[email];
  if (user && user.password === password) {
    // Simple token (not JWT for now)
    const token = `demo_token_${user.id}_${Date.now()}`;
    
    res.json({
      success: true,
      message: 'Demo login başarılı',
      user: {
        id: user.id,
        email: email,
        name: user.name,
        role: user.role
      },
      token: token
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Geçersiz giriş bilgileri'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Geçersiz giriş bilgileri'
    });
  }
});

// User profile API
app.get('/api/user/profile', (req, res) => {
  // Simple token validation (demo)
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token?.startsWith('demo_token_')) {
    const userId = token.split('_')[2];
    res.json({
      success: true,
      user: {
        id: userId,
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'individual'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
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