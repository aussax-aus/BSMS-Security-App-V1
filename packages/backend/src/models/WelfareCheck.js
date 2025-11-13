const mongoose = require('mongoose');

const welfareCheckSchema = new mongoose.Schema({
  officer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  respondedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'ok', 'missed', 'duress'],
    default: 'pending'
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: [Number]
  },
  notes: String,
  isDuress: {
    type: Boolean,
    default: false
  },
  duressAlertSentAt: Date,
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WelfareCheck', welfareCheckSchema);
