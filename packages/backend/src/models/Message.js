const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  toAll: {
    type: Boolean,
    default: false
  },
  toRole: String, // Send to all users with specific role
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site'
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  attachments: [{
    url: String,
    filename: String,
    fileSize: Number
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: Date
  }],
  expiresAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
