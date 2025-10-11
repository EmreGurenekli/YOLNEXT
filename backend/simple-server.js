const express = require('express');
const cors = require('cors');
const { testConnection, syncDatabase } = require('./models/index');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server çalışıyor!' });
});

// Simple auth endpoint (validation olmadan)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType } = req.body;
    
    // Simple validation
    if (!email || !password || !firstName || !lastName || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar gerekli'
      });
    }

    // Mock response
    res.json({
      success: true,
      message: 'Kullanıcı oluşturuldu',
      user: {
        id: '1',
        email,
        firstName,
        lastName,
        userType
      },
      token: 'mock-token-123'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + error.message
    });
  }
});

// Simple login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email ve şifre gerekli'
      });
    }

    // Mock response
    res.json({
      success: true,
      message: 'Giriş başarılı',
      user: {
        id: '1',
        email,
        firstName: 'Test',
        lastName: 'User',
        userType: 'individual'
      },
      token: 'mock-token-123'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + error.message
    });
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalShipments: 12,
      deliveredShipments: 8,
      pendingShipments: 3,
      successRate: 85,
      totalSpent: 2450.50,
      thisMonthSpent: 650.00
    }
  });
});

// Recent shipments endpoint
app.get('/api/dashboard/recent-shipments', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        trackingNumber: 'YN001234567',
        status: 'pending',
        from: 'İstanbul, Şişli',
        to: 'Ankara, Çankaya',
        weight: '3.5 kg',
        value: '₺450',
        date: '2024-01-15',
        description: 'Elektronik eşya - Laptop'
      },
      {
        id: '2',
        trackingNumber: 'YN001234568',
        status: 'in_transit',
        from: 'İstanbul, Beşiktaş',
        to: 'İzmir, Bornova',
        weight: '150 kg',
        value: '₺1,200',
        date: '2024-01-14',
        description: 'Endüstriyel parça'
      }
    ]
  });
});

// Recent offers endpoint
app.get('/api/dashboard/recent-offers', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        carrierName: 'Hızlı Kargo Ltd.',
        price: '₺450',
        deliveryTime: '2-3 gün',
        rating: 4.5,
        status: 'pending',
        shipmentId: '1'
      }
    ]
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    await syncDatabase({ force: false });
    
    app.listen(PORT, () => {
      console.log(`🚀 Simple Server ${PORT} portunda çalışıyor!`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error(`❌ Server başlatma hatası: ${error.message}`);
    process.exit(1);
  }
};

startServer();