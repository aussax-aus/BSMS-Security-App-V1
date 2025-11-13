const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  officer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  subcontractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  responseStatus: {
    type: String,
    enum: ['awaiting-response', 'accepted', 'declined'],
    default: 'awaiting-response'
  },
  checkIn: {
    time: Date,
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    },
    photo: String,
    notes: String
  },
  checkOut: {
    time: Date,
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    },
    photo: String,
    notes: String
  },
  instructions: String,
  equipmentIssued: [{
    item: String,
    issuedAt: Date,
    returnedAt: Date,
    status: {
      type: String,
      enum: ['issued', 'returned', 'missing'],
      default: 'issued'
    }
  }],
  keysIssued: [{
    keyId: String,
    issuedAt: Date,
    returnedAt: Date,
    status: {
      type: String,
      enum: ['issued', 'returned', 'missing'],
      default: 'issued'
    }
  }],
  breaks: [{
    startTime: Date,
    endTime: Date,
    duration: Number // in minutes
  }],
  totalHours: Number,
  rate: Number,
  totalCost: Number,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate total hours before saving
shiftSchema.pre('save', function(next) {
  if (this.checkIn?.time && this.checkOut?.time) {
    const duration = (this.checkOut.time - this.checkIn.time) / (1000 * 60 * 60); // hours
    const breakDuration = this.breaks.reduce((sum, b) => sum + (b.duration || 0), 0) / 60; // convert to hours
    this.totalHours = Math.max(0, duration - breakDuration);
    
    if (this.rate) {
      this.totalCost = this.totalHours * this.rate;
    }
  }
  next();
});

module.exports = mongoose.model('Shift', shiftSchema);
