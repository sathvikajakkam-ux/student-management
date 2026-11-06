/**
 * Authentication & Authorization Middleware
 * Verifies JWT tokens and enforces Role-Based Access Control (RBAC).
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_btech_student_feedback_system_2024';

// Middleware to verify JWT token in the Authorization header
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Token is expected in format: Bearer <token>
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token missing. Please log in.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired session token. Please log in again.'
      });
    }
    // Attach decoded user payload (id, email, role, name) to request
    req.user = decodedUser;
    next();
  });
};

// Optional authentication middleware (allows unauthenticated browsing, but recognizes logged-in users)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (!err && decodedUser) {
      req.user = decodedUser;
    } else {
      req.user = null;
    }
    next();
  });
};

// Middleware to require Admin role
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Administrator privileges are required to access this resource.'
    });
  }
  next();
};

// Middleware to require Student role
const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Only registered students can perform this action.'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireStudent
};

