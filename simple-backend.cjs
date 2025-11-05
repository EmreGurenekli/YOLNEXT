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
    success: true, 
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Mock data
const mockShipments = [
  {
    id: 1,
    from: 'İstanbul',
    to: 'Ankara',
    weight: 100,
    price: 500,
    description: 'Test gönderi 1',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    from: 'İzmir',
    to: 'Bursa',
    weight: 200,
    price: 800,
    description: 'Test gönderi 2',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

// API Routes
app.get('/api/shipments', (req, res) => {
  res.json({
    success: true,
    data: {
      shipments: mockShipments
    }
  });
});

app.post('/api/shipments', (req, res) => {
  const newShipment = {
    id: mockShipments.length + 1,
    ...req.body,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  mockShipments.push(newShipment);
  
  res.json({
    success: true,
    data: newShipment,
    message: 'Gönderi başarıyla oluşturuldu'
  });
});

app.get('/api/offers', (req, res) => {
  res.json({
    success: true,
    data: {
      offers: []
    }
  });
});

app.get('/api/messages', (req, res) => {
  res.json({
    success: true,
    data: {
      messages: []
    }
  });
});

app.get('/api/notifications', (req, res) => {
  res.json({
    success: true,
    data: {
      notifications: []
    }
  });
});

app.get('/api/users/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@example.com',
      userType: 'individual'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Shipments API: http://localhost:${PORT}/api/shipments`);
});



