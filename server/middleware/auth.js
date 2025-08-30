const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    // Handle both header() and get() methods for Authorization header
    const authHeader = req.header ? req.header('Authorization') : req.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user from Supabase database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Normalize user object to match expected format
    req.user = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.is_active,
      phone: user.phone
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Super admin only
const superAdminOnly = authorize('super_admin');

// Marketing and Super Admin
const marketingAccess = authorize('marketing', 'super_admin');

// Logistics and Super Admin
const logisticsAccess = authorize('logistics', 'super_admin');

// Treasurer and Super Admin
const treasurerAccess = authorize('treasurer', 'super_admin');

module.exports = {
  auth,
  authorize,
  superAdminOnly,
  marketingAccess,
  logisticsAccess,
  treasurerAccess
};
