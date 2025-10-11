const express = require('express');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get messages for a chat
router.get('/chat/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .populate('sender', 'fullName email')
    .populate('receiver', 'fullName email')
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message
router.post('/', protect, async (req, res) => {
  try {
    const { receiver, content, shipment } = req.body;
    const sender = req.user.userId;

    const message = new Message({
      sender,
      receiver,
      content,
      shipment
    });

    await message.save();

    // Populate sender info
    await message.populate('sender', 'fullName email');

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark message as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if already read by this user
    const alreadyRead = message.readBy.some(
      read => read.user.toString() === req.user.userId
    );

    if (!alreadyRead) {
      message.readBy.push({
        user: req.user.userId,
        readAt: new Date()
      });
      await message.save();
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


