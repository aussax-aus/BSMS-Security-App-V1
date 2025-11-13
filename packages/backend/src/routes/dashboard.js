const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const Incident = require('../models/Incident');
const Patrol = require('../models/Patrol');
const User = require('../models/User');
const Site = require('../models/Site');
const WelfareCheck = require('../models/WelfareCheck');
const { protect, authorize } = require('../middleware/auth');

// Dashboard overview
router.get('/', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's shifts
    const todayShifts = await Shift.find({
      startTime: { $gte: today }
    }).populate('site officer');
    
    // Get active incidents
    const activeIncidents = await Incident.find({
      status: { $in: ['new', 'dispatched', 'on-scene', 'in-progress'] }
    }).populate('site officer');
    
    // Get in-progress patrols
    const activePatrols = await Patrol.find({
      status: 'in-progress'
    }).populate('site officer');
    
    // Get pending welfare checks
    const pendingWelfareChecks = await WelfareCheck.find({
      status: 'pending',
      scheduledTime: { $lte: new Date() }
    }).populate('officer site');
    
    // Get officer statistics
    const totalOfficers = await User.countDocuments({ role: 'officer', isActive: true });
    const onDuty = todayShifts.filter(s => s.status === 'in-progress').length;
    
    // Get expiring certifications
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const officersWithExpiringCerts = await User.find({
      role: 'officer',
      'certifications.expiryDate': {
        $lte: thirtyDaysFromNow,
        $gte: new Date()
      }
    }).select('firstName lastName certifications');
    
    // Get site statistics
    const totalSites = await Site.countDocuments({ isActive: true });
    const sitesWithActiveShifts = new Set(todayShifts.map(s => s.site._id.toString())).size;
    
    res.json({
      success: true,
      data: {
        shifts: {
          today: todayShifts.length,
          inProgress: todayShifts.filter(s => s.status === 'in-progress').length,
          pending: todayShifts.filter(s => s.status === 'pending').length,
          completed: todayShifts.filter(s => s.status === 'completed').length
        },
        incidents: {
          active: activeIncidents.length,
          critical: activeIncidents.filter(i => i.priority === 'critical').length,
          high: activeIncidents.filter(i => i.priority === 'high').length,
          recent: activeIncidents.slice(0, 5)
        },
        patrols: {
          active: activePatrols.length,
          data: activePatrols
        },
        welfare: {
          pending: pendingWelfareChecks.length,
          missed: pendingWelfareChecks.filter(w => 
            new Date() - w.scheduledTime > 300000 // 5 minutes
          ).length,
          data: pendingWelfareChecks
        },
        officers: {
          total: totalOfficers,
          onDuty,
          available: totalOfficers - onDuty
        },
        compliance: {
          expiringCertifications: officersWithExpiringCerts.length,
          officers: officersWithExpiringCerts
        },
        sites: {
          total: totalSites,
          active: sitesWithActiveShifts
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// Site-specific dashboard
router.get('/site/:siteId', protect, async (req, res, next) => {
  try {
    const { siteId } = req.params;
    
    // Get recent shifts
    const recentShifts = await Shift.find({ site: siteId })
      .sort({ startTime: -1 })
      .limit(10)
      .populate('officer');
    
    // Get recent incidents
    const recentIncidents = await Incident.find({ site: siteId })
      .sort({ reportedAt: -1 })
      .limit(10)
      .populate('officer');
    
    // Get recent patrols
    const recentPatrols = await Patrol.find({ site: siteId })
      .sort({ startTime: -1 })
      .limit(10)
      .populate('officer');
    
    res.json({
      success: true,
      data: {
        shifts: recentShifts,
        incidents: recentIncidents,
        patrols: recentPatrols
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
