const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const { protect, authorize } = require('../middleware/auth');

// Get all shifts (with filters)
router.get('/', protect, async (req, res, next) => {
  try {
    const { officer, site, status, startDate, endDate } = req.query;
    
    const query = {};
    
    // Officers can only see their own shifts
    if (req.user.role === 'officer') {
      query.officer = req.user._id;
    } else if (officer) {
      query.officer = officer;
    }
    
    if (site) query.site = site;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }
    
    const shifts = await Shift.find(query)
      .populate('site', 'name address')
      .populate('officer', 'firstName lastName email phone')
      .populate('subcontractor', 'name')
      .sort({ startTime: 1 });
    
    res.json({
      success: true,
      count: shifts.length,
      data: shifts
    });
  } catch (err) {
    next(err);
  }
});

// Get single shift
router.get('/:id', protect, async (req, res, next) => {
  try {
    const shift = await Shift.findById(req.params.id)
      .populate('site')
      .populate('officer', 'firstName lastName email phone')
      .populate('subcontractor', 'name')
      .populate('createdBy', 'firstName lastName');
    
    if (!shift) {
      return res.status(404).json({ error: { message: 'Shift not found' } });
    }
    
    // Officers can only view their own shifts
    if (req.user.role === 'officer' && shift.officer?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }
    
    res.json({
      success: true,
      data: shift
    });
  } catch (err) {
    next(err);
  }
});

// Create shift (admin/supervisor only)
router.post('/', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const shiftData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const shift = await Shift.create(shiftData);
    
    // Populate for response
    await shift.populate('site officer subcontractor');
    
    // TODO: Send notification to officer
    
    res.status(201).json({
      success: true,
      data: shift
    });
  } catch (err) {
    next(err);
  }
});

// Update shift
router.put('/:id', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const shift = await Shift.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('site officer subcontractor');
    
    if (!shift) {
      return res.status(404).json({ error: { message: 'Shift not found' } });
    }
    
    res.json({
      success: true,
      data: shift
    });
  } catch (err) {
    next(err);
  }
});

// Officer accept/decline shift
router.post('/:id/respond', protect, authorize('officer'), async (req, res, next) => {
  try {
    const { response } = req.body; // 'accepted' or 'declined'
    
    const shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ error: { message: 'Shift not found' } });
    }
    
    if (shift.officer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }
    
    shift.responseStatus = response;
    if (response === 'accepted') {
      shift.status = 'accepted';
    } else {
      shift.status = 'declined';
    }
    
    await shift.save();
    
    res.json({
      success: true,
      data: shift
    });
  } catch (err) {
    next(err);
  }
});

// Check-in to shift
router.post('/:id/checkin', protect, authorize('officer'), async (req, res, next) => {
  try {
    const { location, photo, notes } = req.body;
    
    const shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ error: { message: 'Shift not found' } });
    }
    
    if (shift.officer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }
    
    shift.checkIn = {
      time: new Date(),
      location,
      photo,
      notes
    };
    shift.status = 'in-progress';
    
    await shift.save();
    
    res.json({
      success: true,
      data: shift
    });
  } catch (err) {
    next(err);
  }
});

// Check-out from shift
router.post('/:id/checkout', protect, authorize('officer'), async (req, res, next) => {
  try {
    const { location, photo, notes } = req.body;
    
    const shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ error: { message: 'Shift not found' } });
    }
    
    if (shift.officer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }
    
    shift.checkOut = {
      time: new Date(),
      location,
      photo,
      notes
    };
    shift.status = 'completed';
    
    await shift.save();
    
    // Update officer performance
    req.user.performance.shiftsCompleted += 1;
    await req.user.save();
    
    res.json({
      success: true,
      data: shift
    });
  } catch (err) {
    next(err);
  }
});

// Delete shift
router.delete('/:id', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ error: { message: 'Shift not found' } });
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
