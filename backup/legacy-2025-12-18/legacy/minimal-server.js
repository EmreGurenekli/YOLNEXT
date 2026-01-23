const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Basit gönderi listesi
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

// Basit gönderi oluşturma
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

  res.status(201).json({
    success: true,
    message: 'Gönderi başarıyla oluşturuldu',
    data: newShipment,
  });
});

// Basit vergi numarası doğrulama
app.post('/api/verify/tax-number', (req, res) => {
  const { taxNumber, companyName } = req.body;

  if (!taxNumber || !companyName) {
    return res.status(400).json({
      isValid: false,
      error: 'Vergi numarası ve şirket adı gerekli',
    });
  }

  const isValid = Math.random() > 0.3; // %70 başarı oranı

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

// Basit ehliyet doğrulama
app.post('/api/verify/driver-license', (req, res) => {
  const { licenseNumber, firstName, lastName } = req.body;

  if (!licenseNumber || !firstName || !lastName) {
    return res.status(400).json({
      isValid: false,
      error: 'Ehliyet numarası, ad ve soyad gerekli',
    });
  }

  const isValid = Math.random() > 0.3; // %70 başarı oranı

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
  console.log(`🚀 Minimal Backend server started on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Shipments API: http://localhost:${PORT}/api/shipments`);
  console.log(`🔍 Verification API: http://localhost:${PORT}/api/verify`);
});

module.exports = app;
