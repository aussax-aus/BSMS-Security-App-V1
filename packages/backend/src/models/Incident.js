const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  incidentNumber: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['alarm', 'security-breach', 'safety-issue', 'medical', 'fire', 'theft', 'vandalism', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift'
  },
  officer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'dispatched', 'on-scene', 'in-progress', 'resolved', 'closed'],
    default: 'new'
  },
  
  // Dispatch information
  dispatchedAt: Date,
  dispatchNotes: String,
  
  // Arrival information
  arrivedAt: Date,
  arrivalLocation: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: [Number]
  },
  arrivalPhoto: String,
  arrivalNotes: String,
  
  // Incident details
  description: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: [Number]
  },
  locationDescription: String,
  
  // Response actions
  actions: [{
    timestamp: Date,
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
  // Evidence
  photos: [{
    url: String,
    timestamp: Date,
    description: String
  }],
  videos: [{
    url: String,
    timestamp: Date,
    description: String
  }],
  
  // Completion information
  completedAt: Date,
  outcome: String,
  resolution: String,
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpNotes: String,
  
  // Client sign-off
  clientSignOff: {
    signatureUrl: String,
    photoUrl: String,
    signedBy: String,
    signedAt: Date,
    notes: String
  },
  
  // Additional people involved
  witnesses: [{
    name: String,
    contact: String,
    statement: String
  }],
  authorities: [{
    type: String, // police, fire, ambulance
    contacted: Boolean,
    contactedAt: Date,
    referenceNumber: String,
    officerName: String
  }],
  
  // Metadata
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  tags: [String],
  isConfidential: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate incident number before saving
incidentSchema.pre('save', async function(next) {
  if (!this.incidentNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Incident').countDocuments();
    this.incidentNumber = `INC-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Incident', incidentSchema);
