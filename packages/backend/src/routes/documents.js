const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { protect, authorize } = require('../middleware/auth');

// Get all documents
router.get('/', protect, async (req, res, next) => {
  try {
    const { type, site, accessibleTo } = req.query;
    
    const query = { isActive: true };
    if (type) query.type = type;
    if (site) query.site = site;
    if (accessibleTo) query.accessibleTo = accessibleTo;
    
    // Filter by user access
    if (req.user.role === 'officer') {
      query.$or = [
        { accessibleTo: 'all' },
        { accessibleTo: 'officers' },
        { specificUsers: req.user._id }
      ];
    }
    
    const documents = await Document.find(query)
      .populate('site', 'name')
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (err) {
    next(err);
  }
});

// Get single document
router.get('/:id', protect, async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('site')
      .populate('uploadedBy', 'firstName lastName');
    
    if (!document) {
      return res.status(404).json({ error: { message: 'Document not found' } });
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (err) {
    next(err);
  }
});

// Create document
router.post('/', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const documentData = {
      ...req.body,
      uploadedBy: req.user._id
    };
    
    const document = await Document.create(documentData);
    
    res.status(201).json({
      success: true,
      data: document
    });
  } catch (err) {
    next(err);
  }
});

// Record document completion
router.post('/:id/complete', protect, authorize('officer'), async (req, res, next) => {
  try {
    const { score } = req.body;
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: { message: 'Document not found' } });
    }
    
    let passed = true;
    if (document.knowledgeCheck.enabled) {
      passed = score >= document.knowledgeCheck.passingScore;
    }
    
    document.completions.push({
      user: req.user._id,
      completedAt: new Date(),
      score,
      passed
    });
    
    await document.save();
    
    res.json({
      success: true,
      data: { passed, score }
    });
  } catch (err) {
    next(err);
  }
});

// Update document
router.put('/:id', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!document) {
      return res.status(404).json({ error: { message: 'Document not found' } });
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (err) {
    next(err);
  }
});

// Delete document
router.delete('/:id', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!document) {
      return res.status(404).json({ error: { message: 'Document not found' } });
    }
    
    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
