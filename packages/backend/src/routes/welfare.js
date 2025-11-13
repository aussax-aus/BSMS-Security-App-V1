const express = require('express');
const router = express.Router();
const WelfareCheck = require('../models/WelfareCheck');
const { protect, authorize } = require('../middleware/auth');

// Get welfare checks
router.get('/', protect, async (req, res, next) => {
  try {
    const { officer, shift, status } = req.query;
    
    const query = {};
    if (shift) query.shift = shift;
    if (status) query.status = status;
    
    // Officers can only see their own checks
    if (req.user.role === 'officer') {
      query.officer = req.user._id;
    } else if (officer) {
      query.officer = officer;
    }
    
    const checks = await WelfareCheck.find(query)
      .populate('officer', 'firstName lastName')
      .populate('shift')
      .populate('site', 'name')
      .sort({ scheduledTime: -1 });
    
    res.json({
      success: true,
      count: checks.length,
      data: checks
    });
  } catch (err) {
    next(err);
  }
});

// Respond to welfare check
router.post('/:id/respond', protect, authorize('officer'), async (req, res, next) => {
  try {
    const { location, notes, isDuress } = req.body;
    
    const check = await WelfareCheck.findById(req.params.id);
    
    if (!check) {
      return res.status(404).json({ error: { message: 'Welfare check not found' } });
    }
    
    if (check.officer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }
    
    check.respondedAt = new Date();
    check.status = isDuress ? 'duress' : 'ok';
    check.location = location;
    check.notes = notes;
    check.isDuress = isDuress;
    
    if (isDuress) {
      check.duressAlertSentAt = new Date();
      
      // Send alert to supervisors
      const io = req.app.get('io');
      if (io) {
        io.emit('duress-alert', {
          officer: req.user,
          check,
          location
        });
      }
    }
    
    await check.save();
    
    res.json({
      success: true,
      data: check
    });
  } catch (err) {
    next(err);
  }
});

// Trigger panic button
router.post('/panic', protect, authorize('officer'), async (req, res, next) => {
  try {
    const { location, shift, site, notes } = req.body;
    
    const check = await WelfareCheck.create({
      officer: req.user._id,
      shift,
      site,
      scheduledTime: new Date(),
      respondedAt: new Date(),
      status: 'duress',
      location,
      notes: notes || 'PANIC BUTTON ACTIVATED',
      isDuress: true,
      duressAlertSentAt: new Date()
    });
    
    // Send immediate alert to all supervisors
    const io = req.app.get('io');
    if (io) {
      io.emit('panic-alert', {
        officer: req.user,
        check,
        location
      });
    }
    
    res.status(201).json({
      success: true,
      data: check
    });
  } catch (err) {
    next(err);
  }
});

// Resolve welfare check
router.post('/:id/resolve', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const check = await WelfareCheck.findById(req.params.id);
    
    if (!check) {
      return res.status(404).json({ error: { message: 'Welfare check not found' } });
    }
    
    check.resolvedAt = new Date();
    check.resolvedBy = req.user._id;
    
    await check.save();
    
    res.json({
      success: true,
      data: check
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
