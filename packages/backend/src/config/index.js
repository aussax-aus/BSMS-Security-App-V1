require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bsms_security',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  
  // Email config
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  
  // File upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  
  // Geofencing
  defaultGeofenceRadius: parseInt(process.env.DEFAULT_GEOFENCE_RADIUS) || 100, // meters
  
  // Welfare checks
  welfareCheckInterval: parseInt(process.env.WELFARE_CHECK_INTERVAL) || 1800000 // 30 minutes in ms
};
