const express = require('express');
const router = express.Router();
const { ShipmentRequest, Offer, User } = require('../models');

// Gönderi durumları
const SHIPMENT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active', 
  BIDDING: 'bidding',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// 1. Gönderi oluşturma (Bireysel)
router.post('/create', async (req, res) => {
  try {
    const shipmentData = {
      ...req.body,
      status: SHIPMENT_STATUS.DRAFT,
      trackingCode: generateTrackingCode(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const shipment = await ShipmentRequest.create(shipmentData);
    res.json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Gönderiyi yayınlama (Aktif hale getirme)
router.post('/:id/publish', async (req, res) => {
  try {
    const shipment = await ShipmentRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: SHIPMENT_STATUS.ACTIVE,
        publishedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Gönderi bulunamadı' });
    }

    // Nakliyecilere bildirim gönder
    await notifyCarriers(shipment);

    res.json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Nakliyeciler için aktif gönderileri listeleme
router.get('/active', async (req, res) => {
  try {
    const { page = 1, limit = 10, cargoType, fromCity, toCity } = req.query;
    
    const filter = { status: SHIPMENT_STATUS.ACTIVE };
    if (cargoType) filter.cargoType = cargoType;
    if (fromCity) filter['sender.city'] = new RegExp(fromCity, 'i');
    if (toCity) filter['receiver.city'] = new RegExp(toCity, 'i');

    const shipments = await ShipmentRequest.find(filter)
      .populate('sender', 'name phone')
      .populate('receiver', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ShipmentRequest.countDocuments(filter);

    res.json({
      success: true,
      shipments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Teklif verme (Nakliyeci)
router.post('/:id/offer', async (req, res) => {
  try {
    const { carrierId, price, estimatedDays, notes, vehicleType } = req.body;
    
    const offer = new Offer({
      shipmentId: req.params.id,
      carrierId,
      price,
      estimatedDays,
      notes,
      vehicleType,
      status: 'pending',
      createdAt: new Date()
    });

    await offer.save();

    // Gönderi durumunu güncelle
    await ShipmentRequest.findByIdAndUpdate(req.params.id, {
      status: SHIPMENT_STATUS.BIDDING,
      updatedAt: new Date()
    });

    // Göndericiye bildirim gönder
    await notifySender(req.params.id, 'Yeni teklif geldi');

    res.json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Teklifleri listeleme (Gönderici)
router.get('/:id/offers', async (req, res) => {
  try {
    const offers = await Offer.find({ shipmentId: req.params.id })
      .populate('carrierId', 'name company_name rating')
      .sort({ createdAt: -1 });

    res.json({ success: true, offers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Teklif kabul etme (Gönderici)
router.post('/:id/accept-offer/:offerId', async (req, res) => {
  try {
    const { offerId } = req.params;
    
    // Teklifi kabul et
    await Offer.findByIdAndUpdate(offerId, {
      status: 'accepted',
      acceptedAt: new Date()
    });

    // Diğer teklifleri reddet
    await Offer.updateMany(
      { shipmentId: req.params.id, _id: { $ne: offerId } },
      { status: 'rejected' }
    );

    // Gönderi durumunu güncelle
    await ShipmentRequest.findByIdAndUpdate(req.params.id, {
      status: SHIPMENT_STATUS.ACCEPTED,
      acceptedOfferId: offerId,
      updatedAt: new Date()
    });

    // Nakliyeciye bildirim gönder
    await notifyCarrier(offerId, 'Teklifiniz kabul edildi');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Taşıyıcı atama (Nakliyeci)
router.post('/:id/assign-driver', async (req, res) => {
  try {
    const { driverId } = req.body;
    
    await ShipmentRequest.findByIdAndUpdate(req.params.id, {
      assignedDriverId: driverId,
      status: SHIPMENT_STATUS.IN_PROGRESS,
      assignedAt: new Date(),
      updatedAt: new Date()
    });

    // Taşıyıcıya bildirim gönder
    await notifyDriver(driverId, 'Yeni gönderi atandı');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Gönderi durumu güncelleme (Taşıyıcı)
router.post('/:id/update-status', async (req, res) => {
  try {
    const { status, location, notes, photos } = req.body;
    
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (location) updateData.currentLocation = location;
    if (notes) updateData.driverNotes = notes;
    if (photos) updateData.photos = photos;

    const shipment = await ShipmentRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // İlgili taraflara bildirim gönder
    await notifyStatusUpdate(req.params.id, status);

    res.json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Gönderi takibi (Herkes)
router.get('/:id/track', async (req, res) => {
  try {
    const shipment = await ShipmentRequest.findById(req.params.id)
      .populate('sender', 'name phone')
      .populate('receiver', 'name phone')
      .populate('assignedDriverId', 'name phone')
      .populate('acceptedOfferId');

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Gönderi bulunamadı' });
    }

    res.json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Gönderi iptal etme
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    
    await ShipmentRequest.findByIdAndUpdate(req.params.id, {
      status: SHIPMENT_STATUS.CANCELLED,
      cancelReason: reason,
      cancelledAt: new Date(),
      updatedAt: new Date()
    });

    // İlgili taraflara bildirim gönder
    await notifyCancellation(req.params.id, reason);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Yardımcı fonksiyonlar
function generateTrackingCode() {
  return 'YN' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

async function notifyCarriers(shipment) {
  // Nakliyecilere push notification, email, SMS gönder
  console.log('Nakliyecilere bildirim gönderildi:', shipment.trackingCode);
}

async function notifySender(shipmentId, message) {
  // Göndericiye bildirim gönder
  console.log('Göndericiye bildirim:', message);
}

async function notifyCarrier(offerId, message) {
  // Nakliyeciye bildirim gönder
  console.log('Nakliyeciye bildirim:', message);
}

async function notifyDriver(driverId, message) {
  // Taşıyıcıya bildirim gönder
  console.log('Taşıyıcıya bildirim:', message);
}

async function notifyStatusUpdate(shipmentId, status) {
  // Durum güncellemesi bildirimi
  console.log('Durum güncellendi:', status);
}

async function notifyCancellation(shipmentId, reason) {
  // İptal bildirimi
  console.log('Gönderi iptal edildi:', reason);
}

module.exports = router;





