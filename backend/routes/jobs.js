const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { authenticateToken, requireUserType } = require('../middleware/auth');

// Sürücü işlerini listeleme
router.get(
  '/driver',
  authenticateToken,
  requireUserType(['driver']),
  async (req, res) => {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const query = { driverId: req.user._id };

      if (status) {
        query.status = status;
      }

      const jobs = await Job.find(query)
        .populate(
          'shipmentId',
          'title fromLocation toLocation pickupDate deliveryDate'
        )
        .populate('carrierId', 'companyName')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Job.countDocuments(query);

      res.json({
        success: true,
        data: {
          jobs,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
          },
        },
      });
    } catch (error) {
      console.error('İş listeleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İşler listelenirken hata oluştu',
        error: error.message,
      });
    }
  }
);

// İş detayı
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate(
        'shipmentId',
        'title fromLocation toLocation pickupDate deliveryDate specialRequirements'
      )
      .populate('carrierId', 'companyName phone email')
      .populate('driverId', 'name phone vehicleInfo');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'İş bulunamadı',
      });
    }

    // Sadece ilgili taraflar görebilir
    const canView =
      job.driverId._id.toString() === req.user._id.toString() ||
      job.carrierId.userId.toString() === req.user._id.toString() ||
      job.shipmentId.senderId.toString() === req.user._id.toString();

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Bu işi görme yetkiniz yok',
      });
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('İş detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İş detayı alınırken hata oluştu',
      error: error.message,
    });
  }
});

// İş durumu güncelleme
router.put(
  '/:id/status',
  authenticateToken,
  requireUserType(['driver']),
  async (req, res) => {
    try {
      const { status, location, note } = req.body;

      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'İş bulunamadı',
        });
      }

      if (job.driverId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bu işi güncelleme yetkiniz yok',
        });
      }

      // Durum geçişi kontrolü
      const validTransitions = {
        assigned: ['picked-up'],
        'picked-up': ['in-transit'],
        'in-transit': ['delivered'],
        delivered: [],
        cancelled: [],
      };

      if (!validTransitions[job.status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz durum geçişi',
        });
      }

      job.status = status;
      job.updatedAt = new Date();

      // Durum geçmişine ekle
      job.tracking.statusHistory.push({
        status,
        timestamp: new Date(),
        location: location || '',
        note: note || '',
      });

      // Başlangıç ve bitiş tarihlerini güncelle
      if (status === 'picked-up' && !job.startDate) {
        job.startDate = new Date();
      }
      if (status === 'delivered' && !job.endDate) {
        job.endDate = new Date();
      }

      await job.save();

      res.json({
        success: true,
        message: 'İş durumu güncellendi',
        data: job,
      });
    } catch (error) {
      console.error('İş durumu güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İş durumu güncellenirken hata oluştu',
        error: error.message,
      });
    }
  }
);

// Konum güncelleme
router.put(
  '/:id/location',
  authenticateToken,
  requireUserType(['driver']),
  async (req, res) => {
    try {
      const { lat, lng, address, city } = req.body;

      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'İş bulunamadı',
        });
      }

      if (job.driverId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bu işi güncelleme yetkiniz yok',
        });
      }

      job.tracking.currentLocation = {
        address,
        city,
        coordinates: { lat, lng },
        timestamp: new Date(),
      };

      await job.save();

      res.json({
        success: true,
        message: 'Konum güncellendi',
        data: job.tracking.currentLocation,
      });
    } catch (error) {
      console.error('Konum güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Konum güncellenirken hata oluştu',
        error: error.message,
      });
    }
  }
);

module.exports = router;
