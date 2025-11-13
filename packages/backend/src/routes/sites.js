const express = require('express');
const router = express.Router();
const Site = require('../models/Site');
const { protect, authorize } = require('../middleware/auth');

// Get all sites
router.get('/', protect, async (req, res, next) => {
  try {
    const { client, isActive } = req.query;
    
    const query = {};
    if (client) query.client = client;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const sites = await Site.find(query).populate('client', 'name contact');
    
    res.json({
      success: true,
      count: sites.length,
      data: sites
    });
  } catch (err) {
    next(err);
  }
});

// Get single site
router.get('/:id', protect, async (req, res, next) => {
  try {
    const site = await Site.findById(req.params.id).populate('client');
    
    if (!site) {
      return res.status(404).json({ error: { message: 'Site not found' } });
    }
    
    res.json({
      success: true,
      data: site
    });
  } catch (err) {
    next(err);
  }
});

// Create site (admin only)
router.post('/', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const site = await Site.create(req.body);
    
    res.status(201).json({
      success: true,
      data: site
    });
  } catch (err) {
    next(err);
  }
});

// Update site
router.put('/:id', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const site = await Site.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!site) {
      return res.status(404).json({ error: { message: 'Site not found' } });
    }
    
    res.json({
      success: true,
      data: site
    });
  } catch (err) {
    next(err);
  }
});

// Delete site
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const site = await Site.findByIdAndDelete(req.params.id);
    
    if (!site) {
      return res.status(404).json({ error: { message: 'Site not found' } });
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
