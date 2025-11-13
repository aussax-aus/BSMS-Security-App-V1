const mongoose = require('mongoose');

const patrolSchema = new mongoose.Schema({
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true
  },
  officer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'incomplete'],
    default: 'in-progress'
  },
  checkpoints: [{
    checkpoint: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    checkpointName: String,
    timestamp: {
      type: Date,
      required: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    },
    verificationMethod: {
      type: String,
      enum: ['nfc', 'qr', 'gps'],
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    },
    photo: String,
    notes: String
  }],
  route: [{
    timestamp: Date,
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    },
    accuracy: Number,
    speed: Number
  }],
  totalDistance: Number, // in meters
  photos: [{
    url: String,
    timestamp: Date,
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    },
    description: String
  }],
  notes: String,
  completionStatus: {
    checkpointsVisited: Number,
    totalCheckpoints: Number,
    percentComplete: Number
  }
}, {
  timestamps: true
});

// Calculate completion status before saving
patrolSchema.pre('save', function(next) {
  if (this.checkpoints && this.checkpoints.length > 0) {
    const verified = this.checkpoints.filter(cp => cp.verified).length;
    this.completionStatus = {
      checkpointsVisited: verified,
      totalCheckpoints: this.checkpoints.length,
      percentComplete: Math.round((verified / this.checkpoints.length) * 100)
    };
  }
  next();
});

module.exports = mongoose.model('Patrol', patrolSchema);
