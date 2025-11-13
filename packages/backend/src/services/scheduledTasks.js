const cron = require('node-cron');
const Shift = require('../models/Shift');
const WelfareCheck = require('../models/WelfareCheck');
const User = require('../models/User');
const Site = require('../models/Site');
const config = require('../config');

// Run welfare check scheduler every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('Running welfare check scheduler...');
    
    // Find all in-progress shifts at sites requiring welfare checks
    const activeShifts = await Shift.find({
      status: 'in-progress',
      'checkIn.time': { $exists: true },
      'checkOut.time': { $exists: false }
    }).populate('site');
    
    for (const shift of activeShifts) {
      if (shift.site && shift.site.requiresWelfareChecks) {
        const interval = shift.site.welfareCheckInterval * 60000; // convert minutes to ms
        
        // Find the last welfare check for this shift
        const lastCheck = await WelfareCheck.findOne({
          shift: shift._id,
          officer: shift.officer
        }).sort({ scheduledTime: -1 });
        
        let shouldSchedule = false;
        let scheduledTime = new Date();
        
        if (!lastCheck) {
          // First check: schedule based on check-in time
          const timeSinceCheckIn = Date.now() - shift.checkIn.time.getTime();
          if (timeSinceCheckIn >= interval) {
            shouldSchedule = true;
          }
        } else {
          // Subsequent checks
          const timeSinceLastCheck = Date.now() - lastCheck.scheduledTime.getTime();
          if (timeSinceLastCheck >= interval) {
            shouldSchedule = true;
            scheduledTime = new Date(lastCheck.scheduledTime.getTime() + interval);
          }
        }
        
        if (shouldSchedule) {
          // Check if already scheduled
          const existingCheck = await WelfareCheck.findOne({
            shift: shift._id,
            officer: shift.officer,
            scheduledTime: scheduledTime
          });
          
          if (!existingCheck) {
            await WelfareCheck.create({
              officer: shift.officer,
              shift: shift._id,
              site: shift.site._id,
              scheduledTime,
              status: 'pending'
            });
            console.log(`Scheduled welfare check for shift ${shift._id}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Welfare check scheduler error:', error);
  }
});

// Check for missed welfare checks every minute
cron.schedule('* * * * *', async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 300000); // 5 minutes
    
    const missedChecks = await WelfareCheck.find({
      status: 'pending',
      scheduledTime: { $lte: fiveMinutesAgo }
    }).populate('officer site');
    
    if (missedChecks.length > 0) {
      console.log(`Found ${missedChecks.length} missed welfare checks`);
      
      // Update status and send alerts
      for (const check of missedChecks) {
        check.status = 'missed';
        await check.save();
        
        // TODO: Send alert to supervisors
        console.log(`Missed welfare check alert for officer ${check.officer._id}`);
      }
    }
  } catch (error) {
    console.error('Missed check monitor error:', error);
  }
});

// Check for expiring certifications daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('Checking for expiring certifications...');
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const officers = await User.find({
      role: 'officer',
      isActive: true,
      $or: [
        { licenseExpiry: { $lte: thirtyDaysFromNow, $gte: new Date() } },
        { 'certifications.expiryDate': { $lte: thirtyDaysFromNow, $gte: new Date() } },
        { 'visaStatus.expiryDate': { $lte: thirtyDaysFromNow, $gte: new Date() } }
      ]
    });
    
    if (officers.length > 0) {
      console.log(`Found ${officers.length} officers with expiring credentials`);
      
      // TODO: Send email notifications to supervisors
      // This would use the email service configured in config
    }
  } catch (error) {
    console.error('Certification check error:', error);
  }
});

console.log('Scheduled tasks initialized');
