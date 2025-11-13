const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Get all users (admin/supervisor only)
router.get('/', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { role, isActive } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const users = await User.find(query).select('-password');
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
});

// Get user by ID
router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    
    // Officers can only view their own profile
    if (req.user.role === 'officer' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
});

// Update user
router.put('/:id', protect, async (req, res, next) => {
  try {
    // Officers can only update their own profile
    if (req.user.role === 'officer' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }
    
    // Don't allow role changes unless admin
    if (req.body.role && req.user.role !== 'admin') {
      delete req.body.role;
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
});

// Get expiring certifications
router.get('/:id/expiring-certifications', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    
    const expiring = user.getExpiringCertifications();
    
    res.json({
      success: true,
      data: expiring
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
