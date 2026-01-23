const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  // Demo token kontrolü
  if (token === 'demo-token' || token === 'valid-token' || token.startsWith('demo-jwt-token-')) {
    req.user = { id: 1, type: 'individual' };
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// Input sanitization
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        // SQL injection koruması
        req.body[key] = req.body[key].replace(/['";]/g, '');
        // XSS koruması
        req.body[key] = req.body[key].replace(/<script[^>]*>.*?<\/script>/gi, '');
        req.body[key] = req.body[key].replace(/<[^>]*>/g, '');
      }
    }
  }
  next();
};

// Rate limiting
const rateLimitMap = new Map();

const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 dakika
  const maxRequests = 100;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const userLimit = rateLimitMap.get(ip);
  
  if (now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (userLimit.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests from this IP'
    });
  }

  userLimit.count++;
  next();
};

// Middleware'leri uygula
app.use('/api', sanitizeInput);
app.use('/api', rateLimit);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mock data
let mockShipments = [
  {
    id: 1,
    from: 'İstanbul',
    to: 'Ankara',
    weight: 100,
    price: 500,
    description: 'Test gönderi 1',
    status: 'active',
    createdAt: new Date().toISOString(),
    userId: 1
  },
  {
    id: 2,
    from: 'İzmir',
    to: 'Bursa',
    weight: 200,
    price: 800,
    description: 'Test gönderi 2',
    status: 'active',
    createdAt: new Date().toISOString(),
    userId: 1
  }
];

let mockOffers = [];
let mockMessages = [];
let mockNotifications = [];

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  const csrfToken = Math.random().toString(36).substring(2, 15);
  res.json({ csrfToken });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email && password) {
    const token = 'demo-jwt-token-' + Date.now();
    res.json({
      success: true,
      token: token,
      data: {
        id: 1,
        firstName: 'Demo',
        lastName: 'User',
        email: email,
        userType: 'individual'
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email and password required'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  if (email && password && firstName && lastName) {
    const token = 'demo-jwt-token-' + Date.now();
    res.json({
      success: true,
      token: token,
      data: {
        id: 2,
        firstName: firstName,
        lastName: lastName,
        email: email,
        userType: 'individual'
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'All fields required'
    });
  }
});

// Protected API Routes
app.get('/api/shipments', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      shipments: mockShipments
    }
  });
});

app.post('/api/shipments', authenticateToken, (req, res) => {
  const newShipment = {
    id: mockShipments.length + 1,
    ...req.body,
    status: 'active',
    createdAt: new Date().toISOString(),
    userId: req.user.id
  };
  
  mockShipments.push(newShipment);
  
  res.json({
    success: true,
    data: newShipment,
    message: 'Gönderi başarıyla oluşturuldu'
  });
});

app.get('/api/offers', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      offers: mockOffers
    }
  });
});

app.post('/api/offers', authenticateToken, (req, res) => {
  const newOffer = {
    id: mockOffers.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    userId: req.user.id
  };
  
  mockOffers.push(newOffer);
  
  res.json({
    success: true,
    data: newOffer,
    message: 'Teklif başarıyla oluşturuldu'
  });
});

app.get('/api/messages', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      messages: mockMessages
    }
  });
});

app.post('/api/messages', authenticateToken, (req, res) => {
  const newMessage = {
    id: mockMessages.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    userId: req.user.id
  };
  
  mockMessages.push(newMessage);
  
  res.json({
    success: true,
    data: newMessage,
    message: 'Mesaj başarıyla gönderildi'
  });
});

app.get('/api/notifications', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      notifications: mockNotifications
    }
  });
});

app.post('/api/notifications', authenticateToken, (req, res) => {
  const newNotification = {
    id: mockNotifications.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    userId: req.user.id
  };
  
  mockNotifications.push(newNotification);
  
  res.json({
    success: true,
    data: newNotification,
    message: 'Bildirim başarıyla oluşturuldu'
  });
});

app.get('/api/users/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@example.com',
      userType: req.user.type
    }
  });
});

// Email service endpoint
app.post('/api/send-email', authenticateToken, (req, res) => {
  const { to, subject, body } = req.body;
  
  if (to && subject && body) {
    res.json({
      success: true,
      message: 'Email başarıyla gönderildi',
      data: {
        to: to,
        subject: subject,
        sentAt: new Date().toISOString()
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'To, subject and body required'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Shipments API: http://localhost:${PORT}/api/shipments`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth/login`);
  console.log(`📧 Email API: http://localhost:${PORT}/api/send-email`);
  console.log(`🛡️ Security: CORS, Rate Limiting, Input Sanitization enabled`);
});



