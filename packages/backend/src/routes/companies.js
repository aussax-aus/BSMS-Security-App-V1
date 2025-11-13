const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { protect, authorize } = require('../middleware/auth');

// Get all companies
router.get('/', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { type, isActive } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const companies = await Company.find(query).populate('sites', 'name address');
    
    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (err) {
    next(err);
  }
});

// Get single company
router.get('/:id', protect, async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).populate('sites');
    
    if (!company) {
      return res.status(404).json({ error: { message: 'Company not found' } });
    }
    
    res.json({
      success: true,
      data: company
    });
  } catch (err) {
    next(err);
  }
});

// Create company
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const company = await Company.create(req.body);
    
    res.status(201).json({
      success: true,
      data: company
    });
  } catch (err) {
    next(err);
  }
});

// Update company
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!company) {
      return res.status(404).json({ error: { message: 'Company not found' } });
    }
    
    res.json({
      success: true,
      data: company
    });
  } catch (err) {
    next(err);
  }
});

// Delete company
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    
    if (!company) {
      return res.status(404).json({ error: { message: 'Company not found' } });
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
