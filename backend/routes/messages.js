const express = require('express');
const { body, validationResult } = require('express-validator');
const { Message, User, Shipment } = require('../models');
const { auth } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// @route   GET /api/messages
// @desc    Get user messages
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, shipmentId, userId } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      $or: [
        { senderId: req.user.id },
        { receiverId: req.user.id }
      ]
    };

    if (shipmentId) {
      whereClause.shipmentId = shipmentId;
    }

    if (userId) {
      whereClause.$or = [
        { senderId: req.user.id, receiverId: userId },
        { senderId: userId, receiverId: req.user.id }
      ];
    }

    const messages = await Message.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        },
        {
          model: Shipment,
          as: 'shipment',
          attributes: ['id', 'title', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        messages: messages.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(messages.count / limit),
          totalItems: messages.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesajlar alınırken hata oluştu.'
    });
  }
});

// @route   POST /api/messages
// @desc    Send message
// @access  Private
router.post('/', [
  auth,
  body('receiverId').isUUID().withMessage('Geçerli alıcı ID gerekli'),
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Mesaj içeriği 1-1000 karakter arasında olmalı'),
  body('shipmentId').optional().isUUID().withMessage('Geçerli gönderi ID gerekli'),
  body('messageType').optional().isIn(['text', 'image', 'file', 'location', 'system']).withMessage('Geçersiz mesaj tipi')
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

    const { receiverId, content, shipmentId, messageType = 'text', attachments = [] } = req.body;

    // Check if receiver exists
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Alıcı bulunamadı.'
      });
    }

    // Check if shipment exists (if provided)
    if (shipmentId) {
      const shipment = await Shipment.findByPk(shipmentId);
      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Gönderi bulunamadı.'
        });
      }
    }

    const message = await Message.create({
      senderId: req.user.id,
      receiverId,
      content,
      shipmentId,
      messageType,
      attachments,
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Populate message with relations
    const populatedMessage = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        },
        {
          model: Shipment,
          as: 'shipment',
          attributes: ['id', 'title', 'status']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: populatedMessage,
      message: 'Mesaj gönderildi.'
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj gönderilirken hata oluştu.'
    });
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      where: {
        id: req.params.id,
        receiverId: req.user.id
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı.'
      });
    }

    await message.update({
      isRead: true,
      readAt: new Date()
    });

    res.json({
      success: true,
      message: 'Mesaj okundu olarak işaretlendi.'
    });
  } catch (error) {
    logger.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj işaretlenirken hata oluştu.'
    });
  }
});

// @route   GET /api/messages/conversations
// @desc    Get user conversations
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Message.findAll({
      where: {
        $or: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group by conversation partner
    const conversationMap = new Map();
    
    conversations.forEach(message => {
      const partnerId = message.senderId === req.user.id ? message.receiverId : message.senderId;
      const partner = message.senderId === req.user.id ? message.receiver : message.sender;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partner,
          lastMessage: message,
          unreadCount: 0
        });
      }
      
      if (message.receiverId === req.user.id && !message.isRead) {
        conversationMap.get(partnerId).unreadCount++;
      }
    });

    const conversationList = Array.from(conversationMap.values());

    res.json({
      success: true,
      data: conversationList
    });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Konuşmalar alınırken hata oluştu.'
    });
  }
});
module.exports = router;
