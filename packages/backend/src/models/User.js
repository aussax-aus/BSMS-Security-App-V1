const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'supervisor', 'officer', 'client'],
    default: 'officer'
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: String,
  employeeId: String,
  
  // Officer-specific fields
  licenseNumber: String,
  licenseExpiry: Date,
  certifications: [{
    name: String,
    issueDate: Date,
    expiryDate: Date,
    documentUrl: String
  }],
  inductionStatus: [{
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site'
    },
    completedDate: Date,
    expiryDate: Date
  }],
  visaStatus: {
    number: String,
    expiryDate: Date
  },
  badgePhoto: String,
  
  // Performance tracking
  performance: {
    shiftsCompleted: { type: Number, default: 0 },
    patrolsCompleted: { type: Number, default: 0 },
    incidentsReported: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  
  // Client-specific fields
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if certifications are expiring soon (within 30 days)
userSchema.methods.getExpiringCertifications = function() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  return this.certifications.filter(cert => 
    cert.expiryDate && cert.expiryDate <= thirtyDaysFromNow && cert.expiryDate >= new Date()
  );
};

module.exports = mongoose.model('User', userSchema);
