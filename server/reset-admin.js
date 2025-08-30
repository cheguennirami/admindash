const bcrypt = require('bcryptjs');
const axios = require('axios');
require('dotenv').config();

async function resetAdminPassword() {
  console.log('🔄 Resetting admin password...');
  
  try {
    // Hash the password properly
    const hashedPassword = await bcrypt.hash('AdminPassword123!', 12);
    console.log('🔐 Password hashed successfully');
    
    // Get current data from JSONBin
    const response = await axios.get(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': process.env.JSONBIN_API_KEY,
        'X-Bin-Meta': false
      }
    });
    
    const data = response.data;
    console.log('📖 Current data retrieved');
    
    // Update admin user
    if (data.users && data.users.length > 0) {
      data.users[0] = {
        _id: "admin-001",
        fullName: "Super Administrator",
        email: "admin@sheintoyou.com",
        password: hashedPassword,
        role: "super_admin",
        isActive: true,
        avatar: "",
        phone: "",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create admin user if doesn't exist
      data.users = [{
        _id: "admin-001",
        fullName: "Super Administrator",
        email: "admin@sheintoyou.com",
        password: hashedPassword,
        role: "super_admin",
        isActive: true,
        avatar: "",
        phone: "",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: new Date().toISOString()
      }];
    }
    
    // Update JSONBin
    await axios.put(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': process.env.JSONBIN_API_KEY
      }
    });
    
    console.log('✅ Admin password reset successfully!');
    console.log('📧 Email: admin@sheintoyou.com');
    console.log('🔑 Password: AdminPassword123!');
    console.log('');
    console.log('🎯 You can now login with these credentials');
    
  } catch (error) {
    console.error('❌ Error resetting admin password:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

resetAdminPassword();
