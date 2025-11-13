const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['sop', 'training', 'induction', 'policy', 'form', 'other'],
    required: true
  },
  description: String,
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: Number,
  mimeType: String,
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site'
  },
  accessibleTo: {
    type: String,
    enum: ['all', 'officers', 'supervisors', 'specific'],
    default: 'all'
  },
  specificUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  knowledgeCheck: {
    enabled: {
      type: Boolean,
      default: false
    },
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      explanation: String
    }],
    passingScore: {
      type: Number,
      default: 80
    }
  },
  completions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date,
    score: Number,
    passed: Boolean
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
