/**
 * Authentication Routes
 * Handles user registration, login, and profile fetching.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');
const { isValidEmail, sanitizeUser } = require('../utils/helpers');
const { authenticateToken } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_btech_student_feedback_system_2024';

// ============================================================================
// POST /api/auth/register
// Registers a new Student or Administrator
// ============================================================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, roll_number, department } = req.body;

    // 1. Basic validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const assignedRole = (role === 'admin') ? 'admin' : 'student';

    // If student, roll number is strongly recommended
    if (assignedRole === 'student' && (!roll_number || !roll_number.trim())) {
      return res.status(400).json({ success: false, message: 'Roll/Enrollment number is required for students.' });
    }

    // 2. Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (checkError) {
      console.error('Database query error in register:', checkError);
      return res.status(500).json({ success: false, message: 'Database query failed. Please check connection.' });
    }

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }

    // 3. Hash the password with bcrypt
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 4. Insert new user into database
    const newUserRecord = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      role: assignedRole,
      roll_number: assignedRole === 'student' ? roll_number.trim() : null,
      department: department && department.trim() ? department.trim() : 'Computer Science & Engineering'
    };

    const { data: createdUser, error: insertError } = await supabase
      .from('users')
      .insert([newUserRecord])
      .select('id, name, email, role, roll_number, department, created_at')
      .single();

    if (insertError) {
      console.error('Error inserting user:', insertError);
      return res.status(500).json({ success: false, message: 'Failed to create account. Please try again.' });
    }

    // 5. Generate JWT token
    const tokenPayload = {
      id: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
      name: createdUser.name,
      department: createdUser.department
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: createdUser
    });
  } catch (error) {
    console.error('Unhandled register error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// ============================================================================
// POST /api/auth/login
// Authenticates user and issues JWT token
// ============================================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // 1. Fetch user by email
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (fetchError) {
      console.error('Database query error in login:', fetchError);
      return res.status(500).json({ success: false, message: 'Database connection error.' });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.'
      });
    }

    // 2. Compare password hash
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.'
      });
    }

    // 3. Issue JWT Token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Unhandled login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// ============================================================================
// GET /api/auth/me
// Returns current authenticated user profile
// ============================================================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, roll_number, department, created_at')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
});

module.exports = router;

