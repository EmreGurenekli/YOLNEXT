const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'YolNet Backend is running!'
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo users
  const demoUsers = {
    'individual@demo.com': { password: 'demo123', user: { id: 1, name: 'Demo Individual', email: 'individual@demo.com', panel_type: 'individual' } },
    'corporate@demo.com': { password: 'demo123', user: { id: 2, name: 'Demo Corporate', email: 'corporate@demo.com', panel_type: 'corporate', company_name: 'Demo Şirket A.Ş.' } },
    'nakliyeci@demo.com': { password: 'demo123', user: { id: 3, name: 'Demo Nakliyeci', email: 'nakliyeci@demo.com', panel_type: 'nakliyeci', company_name: 'Demo Nakliye A.Ş.' } },
    'tasiyici@demo.com': { password: 'demo123', user: { id: 4, name: 'Demo Tasiyici', email: 'tasiyici@demo.com', panel_type: 'tasiyici' } }
  };

  if (demoUsers[email] && demoUsers[email].password === password) {
    const token = 'demo-token-' + Date.now();
    res.json({
      message: 'Login successful',
      token,
      user: demoUsers[email].user
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, panel_type } = req.body;
  
  if (!name || !email || !password || !panel_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const token = 'demo-token-' + Date.now();
  res.json({
    message: 'User created successfully',
    token,
    user: { id: Date.now(), name, email, panel_type }
  });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !token.startsWith('demo-token-')) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  res.json({
    user: { id: 1, name: 'Demo User', email: 'demo@example.com', panel_type: 'individual' }
  });
});

// Shipments routes
app.get('/api/shipments', (req, res) => {
  const mockShipments = [
    {
      id: 1,
      title: 'İstanbul - Ankara Kargo',
      from_location: 'İstanbul',
      to_location: 'Ankara',
      price: 150,
      status: 'pending',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'İzmir - Bursa Eşya Taşıma',
      from_location: 'İzmir',
      to_location: 'Bursa',
      price: 200,
      status: 'offers_received',
      created_at: new Date().toISOString()
    }
  ];
  
  res.json(mockShipments);
});

app.post('/api/shipments', (req, res) => {
  const { title, from_location, to_location, price } = req.body;
  
  const newShipment = {
    id: Date.now(),
    title,
    from_location,
    to_location,
    price,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  
  res.json(newShipment);
});

// Messages routes
app.get('/api/messages', (req, res) => {
  const mockMessages = [
    {
      id: 1,
      sender: 'Ahmet Yılmaz',
      message: 'Merhaba, gönderiniz hakkında bilgi alabilir miyim?',
      created_at: new Date().toISOString()
    }
  ];
  
  res.json(mockMessages);
});

app.post('/api/messages', (req, res) => {
  const { message } = req.body;
  
  const newMessage = {
    id: Date.now(),
    message,
    created_at: new Date().toISOString()
  };
  
  res.json(newMessage);
});

// Wallet routes
app.get('/api/wallet', (req, res) => {
  res.json({
    balance: 1250.50,
    currency: 'TRY'
  });
});

app.get('/api/wallet/transactions', (req, res) => {
  const mockTransactions = [
    {
      id: 1,
      type: 'deposit',
      amount: 500,
      description: 'Cüzdana para yatırma',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      type: 'payment',
      amount: -150,
      description: 'Gönderi ödemesi',
      created_at: new Date().toISOString()
    }
  ];
  
  res.json(mockTransactions);
});

// Dashboard routes
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalShipments: 0,
    deliveredShipments: 0,
    pendingShipments: 0,
    successRate: 0,
    totalSpent: 0,
    thisMonthSpent: 0,
    totalSavings: 0,
    thisMonthSavings: 0
  });
});

// Notifications routes
app.get('/api/notifications', (req, res) => {
  const mockNotifications = [
    {
      id: 1,
      user_id: 1,
      type: 'offer_received',
      title: 'Yeni Teklif Geldi',
      message: 'Gönderiniz için yeni bir teklif alındı',
      is_read: false,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      user_id: 1,
      type: 'shipment_status',
      title: 'Gönderi Durumu Güncellendi',
      message: 'Gönderiniz yolda',
      is_read: true,
      created_at: new Date().toISOString()
    }
  ];
  
  res.json({ notifications: mockNotifications });
});

app.get('/api/notifications/unread-count', (req, res) => {
  res.json({ unreadCount: 1 });
});

app.put('/api/notifications/:id/read', (req, res) => {
  res.json({ message: 'Bildirim okundu olarak işaretlendi' });
});

// Analytics routes
app.get('/api/analytics', (req, res) => {
  res.json({
    totalShipments: 25,
    completedShipments: 20,
    totalEarnings: 3750,
    monthlyGrowth: 15.5
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 YolNet Simple Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});