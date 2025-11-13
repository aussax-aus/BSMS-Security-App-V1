const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// Get all messages for user
router.get('/', protect, async (req, res, next) => {
  try {
    const query = {
      $or: [
        { to: req.user._id },
        { toAll: true },
        { toRole: req.user.role }
      ]
    };
    
    const messages = await Message.find(query)
      .populate('from', 'firstName lastName')
      .populate('site', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (err) {
    next(err);
  }
});

// Get single message
router.get('/:id', protect, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('from', 'firstName lastName')
      .populate('to', 'firstName lastName')
      .populate('site', 'name');
    
    if (!message) {
      return res.status(404).json({ error: { message: 'Message not found' } });
    }
    
    res.json({
      success: true,
      data: message
    });
  } catch (err) {
    next(err);
  }
});

// Send message
router.post('/', protect, async (req, res, next) => {
  try {
    const messageData = {
      ...req.body,
      from: req.user._id
    };
    
    const message = await Message.create(messageData);
    await message.populate('from to site');
    
    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      // Emit to specific users or broadcast
      if (message.toAll) {
        io.emit('new-message', { message });
      } else if (message.to && message.to.length > 0) {
        message.to.forEach(user => {
          io.to(`user-${user._id}`).emit('new-message', { message });
        });
      }
    }
    
    res.status(201).json({
      success: true,
      data: message
    });
  } catch (err) {
    next(err);
  }
});

// Mark message as read
router.post('/:id/read', protect, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: { message: 'Message not found' } });
    }
    
    // Check if already read
    const alreadyRead = message.readBy.some(
      read => read.user.toString() === req.user._id.toString()
    );
    
    if (!alreadyRead) {
      message.readBy.push({
        user: req.user._id,
        readAt: new Date()
      });
      await message.save();
    }
    
    res.json({
      success: true,
      data: message
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
