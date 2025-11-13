const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['client', 'subcontractor', 'both'],
    required: true
  },
  abn: String,
  address: {
    street: String,
    city: String,
    state: String,
    postcode: String,
    country: { type: String, default: 'Australia' }
  },
  contact: {
    name: String,
    phone: String,
    email: String
  },
  billingContact: {
    name: String,
    phone: String,
    email: String
  },
  invoiceSettings: {
    rate: Number,
    paymentTerms: String,
    taxRate: { type: Number, default: 10 } // GST percentage
  },
  sites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
