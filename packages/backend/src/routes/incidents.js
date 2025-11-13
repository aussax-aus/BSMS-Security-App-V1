const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const { protect, authorize } = require('../middleware/auth');

// Get all incidents
router.get('/', protect, async (req, res, next) => {
  try {
    const { site, officer, status, type, priority, startDate, endDate } = req.query;
    
    const query = {};
    if (site) query.site = site;
    if (officer) query.officer = officer;
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    
    if (startDate || endDate) {
      query.reportedAt = {};
      if (startDate) query.reportedAt.$gte = new Date(startDate);
      if (endDate) query.reportedAt.$lte = new Date(endDate);
    }
    
    const incidents = await Incident.find(query)
      .populate('site', 'name address')
      .populate('officer', 'firstName lastName')
      .populate('shift')
      .sort({ reportedAt: -1 });
    
    res.json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (err) {
    next(err);
  }
});

// Get single incident
router.get('/:id', protect, async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('site')
      .populate('officer', 'firstName lastName email phone')
      .populate('shift')
      .populate('reportedBy', 'firstName lastName');
    
    if (!incident) {
      return res.status(404).json({ error: { message: 'Incident not found' } });
    }
    
    res.json({
      success: true,
      data: incident
    });
  } catch (err) {
    next(err);
  }
});

// Create incident
router.post('/', protect, async (req, res, next) => {
  try {
    const incidentData = {
      ...req.body,
      officer: req.user._id,
      reportedBy: req.user._id,
      reportedAt: new Date()
    };
    
    const incident = await Incident.create(incidentData);
    await incident.populate('site officer');
    
    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('new-incident', { incident });
    }
    
    // Update officer performance
    req.user.performance.incidentsReported += 1;
    await req.user.save();
    
    res.status(201).json({
      success: true,
      data: incident
    });
  } catch (err) {
    next(err);
  }
});

// Update incident status
router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    
    const incident = await Incident.findById(req.params.id);
    
    if (!incident) {
      return res.status(404).json({ error: { message: 'Incident not found' } });
    }
    
    incident.status = status;
    
    if (status === 'dispatched') {
      incident.dispatchedAt = new Date();
      incident.dispatchNotes = notes;
    } else if (status === 'on-scene') {
      incident.arrivedAt = new Date();
    } else if (status === 'resolved' || status === 'closed') {
      incident.completedAt = new Date();
    }
    
    await incident.save();
    
    res.json({
      success: true,
      data: incident
    });
  } catch (err) {
    next(err);
  }
});

// Record arrival
router.post('/:id/arrival', protect, authorize('officer'), async (req, res, next) => {
  try {
    const { location, photo, notes } = req.body;
    
    const incident = await Incident.findById(req.params.id);
    
    if (!incident) {
      return res.status(404).json({ error: { message: 'Incident not found' } });
    }
    
    incident.arrivedAt = new Date();
    incident.arrivalLocation = location;
    incident.arrivalPhoto = photo;
    incident.arrivalNotes = notes;
    incident.status = 'on-scene';
    
    await incident.save();
    
    res.json({
      success: true,
      data: incident
    });
  } catch (err) {
    next(err);
  }
});

// Complete incident
router.post('/:id/complete', protect, authorize('officer'), async (req, res, next) => {
  try {
    const { outcome, resolution, followUpRequired, followUpNotes } = req.body;
    
    const incident = await Incident.findById(req.params.id);
    
    if (!incident) {
      return res.status(404).json({ error: { message: 'Incident not found' } });
    }
    
    incident.completedAt = new Date();
    incident.outcome = outcome;
    incident.resolution = resolution;
    incident.followUpRequired = followUpRequired;
    incident.followUpNotes = followUpNotes;
    incident.status = 'resolved';
    
    await incident.save();
    
    res.json({
      success: true,
      data: incident
    });
  } catch (err) {
    next(err);
  }
});

// Add client sign-off
router.post('/:id/signoff', protect, authorize('officer'), async (req, res, next) => {
  try {
    const { signatureUrl, photoUrl, signedBy, notes } = req.body;
    
    const incident = await Incident.findById(req.params.id);
    
    if (!incident) {
      return res.status(404).json({ error: { message: 'Incident not found' } });
    }
    
    incident.clientSignOff = {
      signatureUrl,
      photoUrl,
      signedBy,
      signedAt: new Date(),
      notes
    };
    
    await incident.save();
    
    res.json({
      success: true,
      data: incident
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
