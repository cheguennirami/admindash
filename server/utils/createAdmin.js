const User = require('../models/User');

const createAdmin = async () => {
  try {
    // Check if super admin already exists
    const existingAdmin = await User.findOne({ role: 'super_admin' });
    
    if (existingAdmin) {
      console.log('Super admin already exists');
      return;
    }

    // Create default super admin
    const adminData = {
      fullName: 'Super Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@sheintoyou.com',
      password: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
      role: 'super_admin',
      isActive: true
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('Super admin created successfully');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('Please change the default password after first login');
  } catch (error) {
    console.error('Error creating super admin:', error);
  }
};

module.exports = createAdmin;
