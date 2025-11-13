const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const Incident = require('../models/Incident');
const Patrol = require('../models/Patrol');
const { protect, authorize } = require('../middleware/auth');

// Timesheet report
router.get('/timesheets', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { startDate, endDate, officer } = req.query;
    
    const query = {
      status: 'completed',
      'checkOut.time': { $exists: true }
    };
    
    if (startDate) query['checkIn.time'] = { $gte: new Date(startDate) };
    if (endDate) query['checkOut.time'] = { ...query['checkOut.time'], $lte: new Date(endDate) };
    if (officer) query.officer = officer;
    
    const shifts = await Shift.find(query)
      .populate('officer', 'firstName lastName employeeId')
      .populate('site', 'name')
      .sort({ 'checkIn.time': 1 });
    
    // Calculate totals
    const summary = {
      totalShifts: shifts.length,
      totalHours: shifts.reduce((sum, s) => sum + (s.totalHours || 0), 0),
      totalCost: shifts.reduce((sum, s) => sum + (s.totalCost || 0), 0)
    };
    
    // Group by officer
    const byOfficer = {};
    shifts.forEach(shift => {
      const officerId = shift.officer._id.toString();
      if (!byOfficer[officerId]) {
        byOfficer[officerId] = {
          officer: shift.officer,
          shifts: [],
          totalHours: 0,
          totalCost: 0
        };
      }
      byOfficer[officerId].shifts.push(shift);
      byOfficer[officerId].totalHours += shift.totalHours || 0;
      byOfficer[officerId].totalCost += shift.totalCost || 0;
    });
    
    res.json({
      success: true,
      data: {
        shifts,
        summary,
        byOfficer: Object.values(byOfficer)
      }
    });
  } catch (err) {
    next(err);
  }
});

// Incident report
router.get('/incidents', protect, authorize('admin', 'supervisor', 'client'), async (req, res, next) => {
  try {
    const { startDate, endDate, site, type, priority } = req.query;
    
    const query = {};
    
    if (startDate || endDate) {
      query.reportedAt = {};
      if (startDate) query.reportedAt.$gte = new Date(startDate);
      if (endDate) query.reportedAt.$lte = new Date(endDate);
    }
    
    if (site) query.site = site;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    
    const incidents = await Incident.find(query)
      .populate('site', 'name address')
      .populate('officer', 'firstName lastName')
      .sort({ reportedAt: -1 });
    
    // Calculate statistics
    const stats = {
      total: incidents.length,
      byType: {},
      byPriority: {},
      byStatus: {},
      averageResponseTime: 0,
      averageResolutionTime: 0
    };
    
    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let responseCount = 0;
    let resolutionCount = 0;
    
    incidents.forEach(incident => {
      // Count by type
      stats.byType[incident.type] = (stats.byType[incident.type] || 0) + 1;
      
      // Count by priority
      stats.byPriority[incident.priority] = (stats.byPriority[incident.priority] || 0) + 1;
      
      // Count by status
      stats.byStatus[incident.status] = (stats.byStatus[incident.status] || 0) + 1;
      
      // Calculate response time
      if (incident.arrivedAt && incident.dispatchedAt) {
        totalResponseTime += incident.arrivedAt - incident.dispatchedAt;
        responseCount++;
      }
      
      // Calculate resolution time
      if (incident.completedAt && incident.reportedAt) {
        totalResolutionTime += incident.completedAt - incident.reportedAt;
        resolutionCount++;
      }
    });
    
    if (responseCount > 0) {
      stats.averageResponseTime = Math.round(totalResponseTime / responseCount / 60000); // minutes
    }
    
    if (resolutionCount > 0) {
      stats.averageResolutionTime = Math.round(totalResolutionTime / resolutionCount / 60000); // minutes
    }
    
    res.json({
      success: true,
      data: {
        incidents,
        stats
      }
    });
  } catch (err) {
    next(err);
  }
});

// Patrol report
router.get('/patrols', protect, authorize('admin', 'supervisor', 'client'), async (req, res, next) => {
  try {
    const { startDate, endDate, site, officer } = req.query;
    
    const query = {};
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }
    
    if (site) query.site = site;
    if (officer) query.officer = officer;
    
    const patrols = await Patrol.find(query)
      .populate('site', 'name')
      .populate('officer', 'firstName lastName')
      .populate('shift')
      .sort({ startTime: -1 });
    
    // Calculate statistics
    const stats = {
      total: patrols.length,
      completed: patrols.filter(p => p.status === 'completed').length,
      totalCheckpoints: patrols.reduce((sum, p) => sum + (p.completionStatus?.totalCheckpoints || 0), 0),
      verifiedCheckpoints: patrols.reduce((sum, p) => sum + (p.completionStatus?.checkpointsVisited || 0), 0),
      averageCompletionRate: 0
    };
    
    if (stats.totalCheckpoints > 0) {
      stats.averageCompletionRate = Math.round((stats.verifiedCheckpoints / stats.totalCheckpoints) * 100);
    }
    
    res.json({
      success: true,
      data: {
        patrols,
        stats
      }
    });
  } catch (err) {
    next(err);
  }
});

// Export data (CSV/JSON)
router.get('/export/:type', protect, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { type } = req.params;
    const { format = 'json', startDate, endDate } = req.query;
    
    let data;
    let filename;
    
    switch (type) {
      case 'timesheets': {
        const shifts = await Shift.find({
          status: 'completed',
          'checkIn.time': startDate ? { $gte: new Date(startDate) } : undefined,
          'checkOut.time': endDate ? { $lte: new Date(endDate) } : undefined
        }).populate('officer site');
        
        data = shifts;
        filename = `timesheets_${Date.now()}`;
        break;
      }
      case 'incidents': {
        const incidents = await Incident.find({
          reportedAt: {
            ...(startDate && { $gte: new Date(startDate) }),
            ...(endDate && { $lte: new Date(endDate) })
          }
        }).populate('officer site');
        
        data = incidents;
        filename = `incidents_${Date.now()}`;
        break;
      }
      case 'patrols': {
        const patrols = await Patrol.find({
          startTime: {
            ...(startDate && { $gte: new Date(startDate) }),
            ...(endDate && { $lte: new Date(endDate) })
          }
        }).populate('officer site');
        
        data = patrols;
        filename = `patrols_${Date.now()}`;
        break;
      }
      default:
        return res.status(400).json({ error: { message: 'Invalid export type' } });
    }
    
    if (format === 'csv') {
      // TODO: Implement CSV conversion
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send('CSV export not yet implemented');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json({
        success: true,
        data
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
