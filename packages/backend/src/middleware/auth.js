const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ error: { message: 'Not authorized to access this route' } });
    }
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = await User.findById(decoded.id);
      
      if (!req.user) {
        return res.status(401).json({ error: { message: 'User not found' } });
      }
      
      next();
    } catch (err) {
      return res.status(401).json({ error: { message: 'Not authorized to access this route' } });
    }
  } catch (err) {
    next(err);
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Not authorized' } });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: { message: `User role '${req.user.role}' is not authorized to access this route` }
      });
    }
    
    next();
  };
};

exports.signToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpire
  });
};
