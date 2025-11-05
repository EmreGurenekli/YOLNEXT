const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5179',
      'http://localhost:5180',
    ],
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Dashboard endpoints
app.get('/api/dashboard/individual', (req, res) => {
  res.json({
    success: true,
    data: {
      totalShipments: 12,
      deliveredShipments: 8,
      pendingShipments: 3,
      cancelledShipments: 1,
      successRate: 85,
      totalSpent: 2450,
    },
  });
});

app.get('/api/dashboard/corporate', (req, res) => {
  res.json({
    success: true,
    data: {
      totalShipments: 45,
      deliveredShipments: 38,
      pendingShipments: 5,
      cancelledShipments: 2,
      successRate: 92,
      totalSpent: 12500,
    },
  });
});

app.get('/api/dashboard/nakliyeci', (req, res) => {
  res.json({
    success: true,
    data: {
      totalJobs: 25,
      completedJobs: 18,
      activeJobs: 5,
      cancelledJobs: 2,
      successRate: 88,
      totalEarnings: 8500,
    },
  });
});

app.get('/api/dashboard/tasiyici', (req, res) => {
  res.json({
    success: true,
    data: {
      totalShipments: 15,
      completedShipments: 12,
      activeShipments: 2,
      cancelledShipments: 1,
      successRate: 90,
      totalEarnings: 3200,
    },
  });
});

// Shipments endpoints
app.get('/api/shipments/recent/individual', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        trackingCode: 'TRK001',
        title: 'Ev Eşyası Taşıma',
        from: 'İstanbul',
        to: 'Ankara',
        status: 'in_transit',
        createdAt: '2024-01-15T10:00:00Z',
        carrierName: 'Demo Taşıyıcı',
        price: 450,
      },
      {
        id: '2',
        trackingCode: 'TRK002',
        title: 'Ofis Eşyası',
        from: 'İzmir',
        to: 'Bursa',
        status: 'delivered',
        createdAt: '2024-01-14T14:30:00Z',
        carrierName: 'Hızlı Kargo',
        price: 320,
      },
    ],
  });
});

// Notifications endpoint
app.get('/api/notifications/unread-count', (req, res) => {
  res.json({
    success: true,
    data: { count: 3 },
  });
});

// Wallet endpoints
app.get('/api/wallet/nakliyeci', (req, res) => {
  res.json({
    success: true,
    data: {
      balance: 1250.5,
      totalEarnings: 8500.0,
      pendingAmount: 450.0,
      transactions: [
        {
          id: '1',
          type: 'earning',
          amount: 450.0,
          description: 'Gönderi #TRK001 tamamlandı',
          date: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          type: 'withdrawal',
          amount: -200.0,
          description: 'Banka hesabına transfer',
          date: '2024-01-14T16:30:00Z',
        },
      ],
    },
  });
});

// Jobs endpoint
app.get('/api/shipments/nakliyeci', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        title: 'Ev Eşyası Taşıma',
        from: 'İstanbul',
        to: 'Ankara',
        distance: '450 km',
        price: 450,
        weight: '2 ton',
        date: '2024-01-20',
        status: 'available',
      },
      {
        id: '2',
        title: 'Ofis Eşyası',
        from: 'İzmir',
        to: 'Bursa',
        distance: '320 km',
        price: 320,
        weight: '1.5 ton',
        date: '2024-01-22',
        status: 'available',
      },
    ],
  });
});

// Messages endpoint
app.get('/api/messages', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        senderName: 'Demo Taşıyıcı',
        lastMessage: 'Gönderi hazır, ne zaman alabiliriz?',
        timestamp: '2024-01-15T10:30:00Z',
        unreadCount: 2,
      },
      {
        id: '2',
        senderName: 'Hızlı Kargo',
        lastMessage: 'Teslimat tamamlandı, teşekkürler.',
        timestamp: '2024-01-14T16:45:00Z',
        unreadCount: 0,
      },
    ],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Working backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 CORS enabled for: http://localhost:5173`);
});

module.exports = app;
// Gönderi listesi
app.get('/api/shipments', (req, res) => {
  const mockShipments = [
    {
      id: 1,
      userId: 1,
      title: 'Test Gönderisi 1',
      description: 'Bireysel gönderici test gönderisi',
      pickupAddress: 'İstanbul Kadıköy',
      deliveryAddress: 'Ankara Çankaya',
      pickupDate: '2024-10-22',
      weight: 5,
      dimensions: '30x20x15',
      specialRequirements: 'Dikkatli taşıma',
      price: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  res.json({
    success: true,
    data: mockShipments,
  });
});

// Gönderi oluşturma
app.post('/api/shipments', (req, res) => {
  const {
    title,
    description,
    pickupAddress,
    deliveryAddress,
    pickupDate,
    weight,
    dimensions,
    specialRequirements,
    price,
    userId,
  } = req.body;

  if (!title || !pickupAddress || !deliveryAddress) {
    return res.status(400).json({
      success: false,
      message: 'Gerekli alanlar eksik',
    });
  }

  const newShipment = {
    id: Math.floor(Math.random() * 10000) + 1,
    userId: userId || 1,
    title,
    description: description || '',
    pickupAddress,
    deliveryAddress,
    pickupDate: pickupDate || new Date().toISOString(),
    weight: weight || 0,
    dimensions: dimensions || '',
    specialRequirements: specialRequirements || '',
    price: price || 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log('✅ Yeni gönderi oluşturuldu:', newShipment.title);

  res.status(201).json({
    success: true,
    message: 'Gönderi başarıyla oluşturuldu',
    data: newShipment,
  });
});

// Teklifler listesi
app.get('/api/offers', (req, res) => {
  const mockOffers = [
    {
      id: 1,
      shipmentId: 1,
      carrierId: 1,
      price: 150,
      message: 'Hızlı ve güvenli teslimat',
      estimatedDelivery: '2 gün',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ];

  res.json({
    success: true,
    data: mockOffers,
  });
});

// Teklif oluşturma
app.post('/api/offers', (req, res) => {
  const { shipmentId, carrierId, price, message, estimatedDelivery } = req.body;

  if (!shipmentId || !carrierId || !price) {
    return res.status(400).json({
      success: false,
      message: 'Gerekli alanlar eksik',
    });
  }

  const newOffer = {
    id: Math.floor(Math.random() * 10000) + 1,
    shipmentId,
    carrierId,
    price,
    message: message || '',
    estimatedDelivery: estimatedDelivery || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  console.log('✅ Yeni teklif oluşturuldu:', newOffer.id);

  res.status(201).json({
    success: true,
    message: 'Teklif başarıyla oluşturuldu',
    data: newOffer,
  });
});

// Vergi numarası doğrulama
app.post('/api/verify/tax-number', (req, res) => {
  const { taxNumber, companyName } = req.body;

  if (!taxNumber || !companyName) {
    return res.status(400).json({
      isValid: false,
      error: 'Vergi numarası ve şirket adı gerekli',
    });
  }

  const taxNumberRegex = /^\d{10}$/;
  if (!taxNumberRegex.test(taxNumber)) {
    return res.status(400).json({
      isValid: false,
      error: 'Vergi numarası 10 haneli olmalıdır',
    });
  }

  const isValid = Math.random() > 0.2; // %80 başarı oranı

  console.log(`✅ Vergi numarası doğrulandı: ${taxNumber} - ${companyName}`);

  res.json({
    isValid,
    message: isValid
      ? 'Vergi numarası doğrulandı'
      : 'Vergi numarası doğrulanamadı',
    companyInfo: isValid
      ? {
          unvan: companyName,
          vergiNo: taxNumber,
          adres: 'Test Adresi',
        }
      : null,
  });
});

// Ehliyet doğrulama
app.post('/api/verify/driver-license', (req, res) => {
  const { licenseNumber, firstName, lastName } = req.body;

  if (!licenseNumber || !firstName || !lastName) {
    return res.status(400).json({
      isValid: false,
      error: 'Ehliyet numarası, ad ve soyad gerekli',
    });
  }

  const licenseRegex = /^\d{11}$/;
  if (!licenseRegex.test(licenseNumber)) {
    return res.status(400).json({
      isValid: false,
      error: 'Ehliyet numarası 11 haneli olmalıdır',
    });
  }

  const isValid = Math.random() > 0.2; // %80 başarı oranı

  console.log(
    `✅ Ehliyet doğrulandı: ${licenseNumber} - ${firstName} ${lastName}`
  );

  res.json({
    isValid,
    message: isValid
      ? 'Ehliyet numarası doğrulandı'
      : 'Ehliyet numarası doğrulanamadı',
    driverInfo: isValid
      ? {
          ad: firstName,
          soyad: lastName,
          ehliyetNo: licenseNumber,
          ehliyetSinifi: 'B',
        }
      : null,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server started on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Shipments API: http://localhost:${PORT}/api/shipments`);
  console.log(`💰 Offers API: http://localhost:${PORT}/api/offers`);
  console.log(`🔍 Verification API: http://localhost:${PORT}/api/verify`);
  console.log(`✅ Backend tamamen çalışır durumda!`);
});

module.exports = app;
