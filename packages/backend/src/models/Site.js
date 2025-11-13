const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    postcode: String,
    country: { type: String, default: 'Australia' }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  geofenceRadius: {
    type: Number,
    default: 100 // meters
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  emergencyContacts: [{
    name: String,
    phone: String,
    role: String
  }],
  accessCodes: [{
    type: String,
    description: String
  }],
  checkpoints: [{
    name: String,
    type: {
      type: String,
      enum: ['nfc', 'qr', 'gps'],
      required: true
    },
    identifier: String, // NFC tag ID or QR code
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  sops: [{
    title: String,
    documentUrl: String,
    uploadedDate: Date
  }],
  keyRegister: [{
    keyId: String,
    description: String,
    location: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  requiresWelfareChecks: {
    type: Boolean,
    default: false
  },
  welfareCheckInterval: {
    type: Number, // in minutes
    default: 30
  }
}, {
  timestamps: true
});

// Create geospatial index for location queries
siteSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Site', siteSchema);
