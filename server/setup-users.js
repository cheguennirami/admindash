const axios = require('axios');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupUsers() {
  try {
    console.log('🔧 Setting up users in JSONBin...');
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('AdminPassword123!', 12);
    const userPassword = await bcrypt.hash('password123', 12);
    
    const users = [
      {
        _id: 'admin-001',
        fullName: 'Super Administrator',
        email: 'admin@sheintoyou.com',
        password: adminPassword,
        role: 'super_admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      },
      {
        _id: 'marketing-001',
        fullName: 'Marketing Manager',
        email: 'marketing@sheintoyou.com',
        password: userPassword,
        role: 'marketing',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      },
      {
        _id: 'logistics-001',
        fullName: 'Logistics Coordinator',
        email: 'logistics@sheintoyou.com',
        password: userPassword,
        role: 'logistics',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      },
      {
        _id: 'treasurer-001',
        fullName: 'Financial Manager',
        email: 'treasurer@sheintoyou.com',
        password: userPassword,
        role: 'treasurer',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      }
    ];

    const data = {
      users: users,
      clients: [],
      settings: {
        companyName: 'Shein TO YOU',
        currency: 'TND',
        advancePercentage: 30
      }
    };

    const response = await axios.put(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': process.env.JSONBIN_API_KEY
      }
    });

    console.log('✅ Users created successfully!');
    console.log('📊 Created users:');
    users.forEach(user => {
      console.log(`  - ${user.fullName} (${user.email}) - Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up users:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

setupUsers();
