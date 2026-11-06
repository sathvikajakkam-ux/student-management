/**
 * Student Feedback Management System - Backend Server
 * Technology Stack: Node.js, Express.js, Supabase PostgreSQL
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const supabase = require('./supabase');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// 1. MIDDLEWARE CONFIGURATION
// ============================================================================

// Enable CORS for API requests
app.use(cors());

// Parse incoming JSON payloads and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Frontend Static Assets directly from 'frontend' directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Basic request logger for development visibility
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ============================================================================
// 2. API ROUTES
// ============================================================================

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'connected';
  try {
    const { error } = await supabase.from('courses').select('id').limit(1);
    if (error) {
      dbStatus = `disconnected (${error.message})`;
    }
  } catch (err) {
    dbStatus = `error (${err.message})`;
  }

  res.json({
    status: 'ok',
    service: 'Student Feedback Management System API',
    uptime: Math.round(process.uptime()) + ' seconds',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Mount modular sub-routers
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/feedback', feedbackRoutes);

// ============================================================================
// 3. FRONTEND SPA FALLBACK
// ============================================================================

// Any non-API route serves index.html to support single-page navigation
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint '${req.originalUrl}' not found.`
    });
  }
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ============================================================================
// 4. CENTRALIZED ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Unhandled Server Exception:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred. Please try again later.'
  });
});

// ============================================================================
// 5. SERVER INITIALIZATION
// ============================================================================

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Student Feedback System Server is running!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🩺 Health API: http://localhost:${PORT}/api/health`);
  console.log(`📁 Static files served from: ${path.join(__dirname, '..', 'frontend')}`);
  console.log('====================================================');
});

module.exports = app;

