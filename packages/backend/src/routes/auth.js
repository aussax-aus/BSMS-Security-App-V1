const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { signToken } = require('../middleware/auth');

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: { message: 'User already exists' } });
    }
    
    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'officer'
    });
    
    // Generate token
    const token = signToken(user._id);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: { message: 'Please provide email and password' } });
    }
    
    // Check user exists and get password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = signToken(user._id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// Get current user
router.get('/me', require('../middleware/auth').protect, async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
