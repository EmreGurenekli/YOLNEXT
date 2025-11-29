const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const redis = require('redis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Redis client for caching
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.connect().then(() => {
  console.log('✅ Redis connected');
}).catch((err) => {
  console.error('❌ Redis connection failed:', err);
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Demo token support - for testing purposes
    if (token.startsWith('demo-token-')) {
      const userType = token.replace('demo-token-', '').split('-')[0];
      const userId = token.replace(`demo-token-${userType}-`, '');
      req.user = {
        userId: userId,
        email: `demo@${userType}.com`,
        role: userType,
        isDemo: true
      };
      return next();
    }

    // Check Redis cache first
    const cachedUser = await redisClient.get(`user:${token}`);
    if (cachedUser) {
      req.user = JSON.parse(cachedUser);
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Cache user data
    await redisClient.setEx(`user:${token}`, 300, JSON.stringify(decoded)); // 5 minutes cache
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Service discovery and routing
const services = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    routes: ['/api/auth/*']
  },
  users: {
    url: process.env.USERS_SERVICE_URL || 'http://localhost:3002',
    routes: ['/api/users/*']
  },
  shipments: {
    url: process.env.SHIPMENTS_SERVICE_URL || 'http://localhost:3003',
    routes: ['/api/shipments/*']
  },
  offers: {
    url: process.env.OFFERS_SERVICE_URL || 'http://localhost:3004',
    routes: ['/api/offers/*']
  },
  carriers: {
    url: process.env.CARRIERS_SERVICE_URL || 'http://localhost:3005',
    routes: ['/api/carriers/*']
  },
  notifications: {
    url: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3006',
    routes: ['/api/notifications/*']
  },
  messaging: {
    url: process.env.MESSAGING_SERVICE_URL || 'http://localhost:3007',
    routes: ['/api/messages/*']
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: Object.keys(services)
  });
});

// Service routing
Object.entries(services).forEach(([serviceName, serviceConfig]) => {
  serviceConfig.routes.forEach(route => {
    const proxyOptions = {
      target: serviceConfig.url,
      changeOrigin: true,
      pathRewrite: {
        [`^${route.replace('*', '')}`]: ''
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add user info to headers
        if (req.user) {
          proxyReq.setHeader('X-User-Id', req.user.userId);
          proxyReq.setHeader('X-User-Type', req.user.panel_type);
        }
      },
      onError: (err, req, res) => {
        console.error(`Error proxying to ${serviceName}:`, err);
        res.status(503).json({ 
          error: `${serviceName} service unavailable`,
          message: 'Service temporarily unavailable, please try again later'
        });
      }
    };

    // Apply authentication to protected routes
    if (route.includes('/api/') && !route.includes('/api/auth/')) {
      app.use(route, authenticateToken, createProxyMiddleware(proxyOptions));
    } else {
      app.use(route, createProxyMiddleware(proxyOptions));
    }
  });
});

// Cache middleware for GET requests
const cacheMiddleware = async (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  try {
    const cacheKey = `cache:${req.originalUrl}`;
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Store response in cache
    const originalSend = res.json;
    res.json = function(data) {
      redisClient.setEx(cacheKey, 300, JSON.stringify(data)); // 5 minutes cache
      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Cache error:', error);
    next();
  }
};

// Apply cache middleware to specific routes
app.use('/api/shipments', cacheMiddleware);
app.use('/api/offers', cacheMiddleware);
app.use('/api/carriers', cacheMiddleware);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Gateway Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 YolNext API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Services: ${Object.keys(services).join(', ')}`);
});

module.exports = app;





