const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { User, Shipment, Offer } = require('../models');
const { auth } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', [
  auth,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('isRead').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 10, isRead } = req.query;
    const offset = (page - 1) * limit;

    // For now, we'll return mock notifications
    // In a real implementation, you would have a Notifications table
    const mockNotifications = [
      {
        id: '1',
        type: 'offer_received',
        title: 'Yeni Teklif',
        message: 'Gönderiniz için yeni bir teklif aldınız',
        isRead: false,
        createdAt: new Date(),
        data: {
          shipmentId: 'shipment-1',
          offerId: 'offer-1'
        }
      },
      {
        id: '2',
        type: 'offer_accepted',
        title: 'Teklif Kabul Edildi',
        message: 'Teklifiniz kabul edildi',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000),
        data: {
          shipmentId: 'shipment-2',
          offerId: 'offer-2'
        }
      }
    ];

    let filteredNotifications = mockNotifications;
    if (isRead !== undefined) {
      filteredNotifications = mockNotifications.filter(n => n.isRead === (isRead === 'true'));
    }

    const paginatedNotifications = filteredNotifications.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        notifications: paginatedNotifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredNotifications.length / limit),
          totalItems: filteredNotifications.length,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    // In a real implementation, you would update the notification in the database
    logger.info(`Bildirim okundu olarak işaretlendi: ${req.params.id} - ${req.user.email}`);

    res.json({
      success: true,
      message: 'Bildirim okundu olarak işaretlendi'
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    // In a real implementation, you would update all notifications for the user
    logger.info(`Tüm bildirimler okundu olarak işaretlendi: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Tüm bildirimler okundu olarak işaretlendi'
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // In a real implementation, you would delete the notification from the database
    logger.info(`Bildirim silindi: ${req.params.id} - ${req.user.email}`);

    res.json({
      success: true,
      message: 'Bildirim silindi'
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;