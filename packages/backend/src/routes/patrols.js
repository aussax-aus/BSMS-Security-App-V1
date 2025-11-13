const express = require('express');
const router = express.Router();
const Patrol = require('../models/Patrol');
const { protect, authorize } = require('../middleware/auth');
const geolib = require('geolib');

// Get all patrols
router.get('/', protect, async (req, res, next) => {
  try {
    const { shift, officer, site, status } = req.query;
    
    const query = {};
    if (shift) query.shift = shift;
    if (site) query.site = site;
    if (status) query.status = status;
    
    // Officers can only see their own patrols
    if (req.user.role === 'officer') {
      query.officer = req.user._id;
    } else if (officer) {
      query.officer = officer;
    }
    
    const patrols = await Patrol.find(query)
      .populate('shift')
      .populate('officer', 'firstName lastName')
      .populate('site', 'name address')
      .sort({ startTime: -1 });
    
    res.json({
      success: true,
      count: patrols.length,
      data: patrols
    });
  } catch (err) {
    next(err);
  }
});

// Get single patrol
router.get('/:id', protect, async (req, res, next) => {
  try {
    const patrol = await Patrol.findById(req.params.id)
      .populate('shift')
      .populate('officer', 'firstName lastName')
      .populate('site');
    
    if (!patrol) {
      return res.status(404).json({ error: { message: 'Patrol not found' } });
    }
    
    res.json({
      success: true,
      data: patrol
    });
  } catch (err) {
    next(err);
  }
});

// Start patrol
router.post('/start', protect, authorize('officer'), async (req, res, next) => {
  try {
    const { shift, site } = req.body;
    
    const patrol = await Patrol.create({
      shift,
      officer: req.user._id,
      site,
      startTime: new Date(),
      status: 'in-progress'
    });
    
    await patrol.populate('shift site');
    
    res.status(201).json({
      success: true,
      data: patrol
    });
  } catch (err) {
    next(err);
  }
});

// Record checkpoint
router.post('/:id/checkpoint', protect, authorize('officer'), async (req, res, next) => {
  try {
    const { checkpoint, checkpointName, location, verificationMethod, photo, notes } = req.body;
    
    const patrol = await Patrol.findById(req.params.id).populate('site');
    
    if (!patrol) {
      return res.status(404).json({ error: { message: 'Patrol not found' } });
    }
    
    if (patrol.officer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }
    
    // Verify checkpoint is within geofence
    const siteCheckpoint = patrol.site.checkpoints.id(checkpoint);
    let verified = false;
    
    if (siteCheckpoint && location) {
      const distance = geolib.getDistance(
        { latitude: location.coordinates[1], longitude: location.coordinates[0] },
        { latitude: siteCheckpoint.location.coordinates[1], longitude: siteCheckpoint.location.coordinates[0] }
      );
      
      verified = distance <= patrol.site.geofenceRadius;
    }
    
    patrol.checkpoints.push({
      checkpoint,
      checkpointName,
      timestamp: new Date(),
      location,
      verificationMethod,
      verified,
      photo,
      notes
    });
    
    await patrol.save();
    
    res.json({
      success: true,
      data: patrol
    });
  } catch (err) {
    next(err);
  }
});

// Update patrol route (GPS tracking)
router.post('/:id/location', protect, authorize('officer'), async (req, res, next) => {
  try {
    const { location, accuracy, speed } = req.body;
    
    const patrol = await Patrol.findById(req.params.id);
    
    if (!patrol) {
      return res.status(404).json({ error: { message: 'Patrol not found' } });
    }
    
    if (patrol.officer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }
    
    patrol.route.push({
      timestamp: new Date(),
      location,
      accuracy,
      speed
    });
    
    await patrol.save();
    
    res.json({
      success: true,
      data: { message: 'Location updated' }
    });
  } catch (err) {
    next(err);
  }
});

// Complete patrol
router.post('/:id/complete', protect, authorize('officer'), async (req, res, next) => {
  try {
    const { notes } = req.body;
    
    const patrol = await Patrol.findById(req.params.id);
    
    if (!patrol) {
      return res.status(404).json({ error: { message: 'Patrol not found' } });
    }
    
    if (patrol.officer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'Not authorized' } });
    }
    
    patrol.endTime = new Date();
    patrol.status = 'completed';
    patrol.notes = notes;
    
    await patrol.save();
    
    // Update officer performance
    req.user.performance.patrolsCompleted += 1;
    await req.user.save();
    
    res.json({
      success: true,
      data: patrol
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
