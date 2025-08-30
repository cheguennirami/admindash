const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const supabase = require('../supabaseClient');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user in database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password, role, full_name, is_active, avatar, phone')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // Return user data in the same format as login
    res.json({
      id: req.user.id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('fullName').optional().isLength({ min: 2, max: 100 }),
  body('phone').optional().isLength({ max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { fullName, phone, avatar } = req.body;

    // Prepare update data
    const updateData = {};
    if (fullName) updateData.full_name = fullName;
    if (phone) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Update in database
    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData);

    res.json({
      id: updatedUser.id,
      fullName: updatedUser.full_name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      avatar: updatedUser.avatar
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', [
  auth,
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Find user in database
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await User.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password in database
    await User.findByIdAndUpdate(req.user.id, { password: newPassword });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// TEMPORARY DEBUG ROUTE - Remove after testing
// @route   GET /api/auth/debug
// @desc    Debug database connection and user existence
// @access  Public (temporary)
router.get('/debug', async (req, res) => {
  try {
    console.log('Testing database connection...');

    // Test connection and get user count
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, full_name, is_active')
      .limit(10);

    if (usersError) {
      console.error('Users query error:', usersError);
      return res.status(500).json({
        message: 'Database connection error',
        error: usersError.message
      });
    }

    // Check for admin user
    const { data: adminUser } = await supabase
      .from('users')
      .select('id, email, role, full_name, is_active')
      .eq('email', 'admin@sheintoyou.com')
      .single();

    console.log('Users found:', users.length);
    console.log('Admin user exists:', !!adminUser);

    res.json({
      database_connected: true,
      user_count: users.length,
      admin_exists: !!adminUser,
      admin_details: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        active: adminUser.is_active
      } : null,
      all_users: users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        active: u.is_active
      }))
    });

  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({
      message: 'Debug route error',
      error: error.message
    });
  }
});

module.exports = router;
