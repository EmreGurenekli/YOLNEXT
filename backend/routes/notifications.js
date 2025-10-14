const express = require('express');
const { body, validationResult } = require('express-validator');
const { Notification, User } = require('../models');
const { auth } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, isRead } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };

    if (type) whereClause.type = type;
    if (category) whereClause.category = category;
    if (isRead !== undefined) whereClause.isRead = isRead === 'true';

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        notifications: notifications.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(notifications.count / limit),
          totalItems: notifications.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirimler alınırken hata oluştu.'
    });
  }
});

// @route   POST /api/notifications
// @desc    Create notification
// @access  Private
router.post('/', [
  auth,
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Başlık 1-100 karakter arasında olmalı'),
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Mesaj 1-500 karakter arasında olmalı'),
  body('type').isIn(['info', 'success', 'warning', 'error', 'offer', 'shipment', 'payment', 'system']).withMessage('Geçersiz bildirim tipi'),
  body('category').isIn(['shipment', 'offer', 'payment', 'system', 'message', 'reminder']).withMessage('Geçersiz bildirim kategorisi'),
  body('actionUrl').optional().isURL().withMessage('Geçerli URL gerekli')
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

    const { title, message, type, category, actionUrl, metadata = {} } = req.body;

    const notification = await Notification.create({
      userId: req.user.id,
      title,
      message,
      type,
      category,
      actionUrl,
      metadata
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Bildirim oluşturuldu.'
    });
  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim oluşturulurken hata oluştu.'
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı.'
      });
    }

    await notification.update({
      isRead: true,
      readAt: new Date()
    });

    res.json({
      success: true,
      message: 'Bildirim okundu olarak işaretlendi.'
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim işaretlenirken hata oluştu.'
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          userId: req.user.id,
          isRead: false
        }
      }
    );

    res.json({
      success: true,
      message: 'Tüm bildirimler okundu olarak işaretlendi.'
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirimler işaretlenirken hata oluştu.'
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notifications count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.count({
      where: {
        userId: req.user.id,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Okunmamış bildirim sayısı alınırken hata oluştu.'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı.'
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Bildirim silindi.'
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim silinirken hata oluştu.'
    });
  }
});

module.exports = router;