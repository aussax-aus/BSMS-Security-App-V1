const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(config.uploadPath));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/patrols', require('./routes/patrols'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/welfare', require('./routes/welfare'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(config.nodeEnv === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

// Database connection
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    const server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
    
    // Socket.io for real-time features
    const io = require('socket.io')(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    
    // Make io accessible to routes
    app.set('io', io);
    
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('join-shift', (shiftId) => {
        socket.join(`shift-${shiftId}`);
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
    
    // Initialize scheduled tasks
    require('./services/scheduledTasks');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(false, () => {
    process.exit(0);
  });
});

module.exports = app;
