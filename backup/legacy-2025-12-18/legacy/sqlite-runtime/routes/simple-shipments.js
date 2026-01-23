const express = require('express');
const router = express.Router();

// GET /api/shipments - Kullanıcının gönderilerini listele
router.get('/', (req, res) => {
  try {
    // Demo veriler - gerçek DB bağlantısı için PostgreSQL gerekli
    const shipments = [
      {
        id: 1,
        userId: 1,
        fromCity: 'İstanbul',
        toCity: 'Ankara',
        weight: 100,
        volume: 2.5,
        deliveryDate: '2024-01-15',
        specialRequirements: 'Hassas kargo',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        userId: 1,
        fromCity: 'İzmir',
        toCity: 'Bursa',
        weight: 200,
        volume: 5.0,
        deliveryDate: '2024-01-20',
        specialRequirements: 'Soğuk zincir',
        status: 'in_progress',
        createdAt: new Date().toISOString(),
      },
    ];

    res.json({
      success: true,
      data: { shipments },
      message: 'Gönderiler başarıyla getirildi',
    });
  } catch (error) {
    console.error('Shipments GET error:', error);
    res.status(500).json({
      success: false,
      error: 'Gönderiler getirilemedi',
      message: error.message,
    });
  }
});

// POST /api/shipments - Yeni gönderi oluştur
router.post('/', (req, res) => {
  try {
    const {
      fromCity,
      toCity,
      weight,
      volume,
      deliveryDate,
      specialRequirements,
    } = req.body;

    // Basit validasyon
    if (!fromCity || !toCity || !weight || !volume || !deliveryDate) {
      return res.status(400).json({
        success: false,
        error: 'Eksik alanlar var',
        message: 'Tüm zorunlu alanları doldurun',
      });
    }

    // Demo gönderi oluştur
    const newShipment = {
      id: Date.now(),
      userId: 1, // Demo user ID
      fromCity,
      toCity,
      weight: parseFloat(weight),
      volume: parseFloat(volume),
      deliveryDate,
      specialRequirements: specialRequirements || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      data: { shipment: newShipment },
      message: 'Gönderi başarıyla oluşturuldu',
    });
  } catch (error) {
    console.error('Shipment POST error:', error);
    res.status(500).json({
      success: false,
      error: 'Gönderi oluşturulamadı',
      message: error.message,
    });
  }
});

module.exports = router;
