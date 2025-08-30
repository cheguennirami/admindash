const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, superAdminOnly } = require('../middleware/auth');
const supabase = require('../supabaseClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Super Admin only)
// @access  Private
router.get('/', auth, superAdminOnly, async (req, res) => {
  try {
    // Fetch users from JSONBin database
    const users = await User.find();
    // Remove passwords and sort by creation date
    const usersWithoutPassword = users
      .map(user => {
        const { password_hash, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          fullName: user.full_name,
          isActive: user.is_active
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(usersWithoutPassword);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create new user (Super Admin only)
// @access  Private
router.post('/', [
  auth,
  superAdminOnly,
  body('fullName').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['marketing', 'logistics', 'treasurer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { fullName, email, password, role, phone } = req.body;

    const newUser = await User.create({
      fullName,
      email,
      password,
      role,
      phone: phone || '',
      isActive: true,
      avatar: '',
      createdBy: req.user.id
    });

    // Remove password_hash before sending response
    const { password_hash: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Super Admin or own profile)
// @access  Private
router.put('/:id', [
  auth,
  body('fullName').optional().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['marketing', 'logistics', 'treasurer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { fullName, email, role, phone, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isOwnProfile = req.user.id === req.params.id;
    const isSuperAdmin = req.user.role === 'super_admin';

    // Users can only update their own profile, super admins can update any user
    if (!isOwnProfile && !isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied: You can only update your own profile' });
    }

    // Prevent super admin from being modified by another super admin
    if (user.role === 'super_admin' && !isOwnProfile) {
      return res.status(403).json({ message: 'Cannot modify another super admin' });
    }

    // Restrict certain fields for non-super-admin users updating their own profile
    if (isOwnProfile && !isSuperAdmin) {
      // Regular users can only update: fullName, email, phone
      if (role !== undefined || isActive !== undefined) {
        return res.status(403).json({ message: 'Access denied: You cannot modify role or active status' });
      }
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const updateData = {};
    if (fullName) updateData.full_name = fullName;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    // Only super admins can update these fields
    if (isSuperAdmin) {
      if (role && user.role !== 'super_admin') updateData.role = role;
      if (isActive !== undefined) updateData.is_active = isActive;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found after update' });
    }

    res.json({
      id: updatedUser.id,
      fullName: updatedUser.full_name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      isActive: updatedUser.is_active
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Super Admin only)
// @access  Private
router.delete('/:id', auth, superAdminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent super admin deletion
    if (user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot delete super admin' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
