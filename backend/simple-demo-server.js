const express = require('express');
const cors = require('cors');
const app = express();

const PORT = 5000;

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Demo users
const demoUsers = {
  'individual@demo.com': { password: 'demo123', userType: 'individual' },
  'corporate@demo.com': { password: 'demo123', userType: 'corporate' },
  'nakliyeci@demo.com': { password: 'demo123', userType: 'nakliyeci' },
  'tasiyici@demo.com': { password: 'demo123', userType: 'tasiyici' }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'YolNet Backend is running!' });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', email);
  
  if (demoUsers[email] && demoUsers[email].password === password) {
    const userData = {
      id: 'demo-' + Date.now(),
      firstName: 'Demo',
      lastName: 'User',
      email: email,
      userType: demoUsers[email].userType,
      phone: '+90 555 000 0000',
      avatar: null,
      isActive: true,
      isVerified: true
    };

    console.log('Login successful for:', email, 'userType:', userData.userType);
    
    res.json({
      success: true,
      message: 'Demo giriş başarılı',
      data: {
        user: userData,
        token: 'demo-token-' + Date.now()
      }
    });
  } else {
    console.log('Login failed for:', email);
    res.status(401).json({
      success: false,
      message: 'Geçersiz email veya şifre'
    });
  }
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && token.startsWith('demo-token-')) {
    res.json({
      success: true,
      data: {
        user: {
          id: 'demo-user',
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@yolnet.com',
          userType: 'individual',
          isActive: true,
          isVerified: true
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
});

// Dashboard endpoints
app.get('/api/shipments', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const demoShipments = [
    {
      id: 'ship-1',
      trackingNumber: 'YN001234567',
      origin: 'İstanbul',
      destination: 'Ankara',
      status: 'in_transit',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ship-2',
      trackingNumber: 'YN001234568',
      origin: 'İzmir',
      destination: 'Bursa',
      status: 'delivered',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedDelivery: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: {
      shipments: demoShipments.slice(0, limit),
      total: demoShipments.length
    }
  });
});

app.get('/api/offers', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const demoOffers = [
    {
      id: 'offer-1',
      carrierName: 'Hızlı Kargo Ltd.',
      price: 1500,
      estimatedDays: 2,
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'offer-2',
      carrierName: 'Güvenli Taşımacılık',
      price: 1200,
      estimatedDays: 3,
      status: 'accepted',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: {
      offers: demoOffers.slice(0, limit),
      total: demoOffers.length
    }
  });
});

// Dashboard statistics
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalShipments: 25,
      activeShipments: 8,
      completedShipments: 17,
      totalOffers: 45,
      pendingOffers: 12,
      acceptedOffers: 33,
      totalRevenue: 125000,
      monthlyRevenue: 25000
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 YolNet Demo Backend running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
