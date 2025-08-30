const axios = require('axios');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixAuthentication() {
  console.log('🔧 Fixing authentication system...');
  
  try {
    // Create properly hashed password
    const adminPassword = await bcrypt.hash('AdminPassword123!', 12);
    console.log('✅ Password hashed successfully');
    
    // Create the correct data structure
    const data = {
      users: [
        {
          _id: 'admin-001',
          fullName: 'Super Administrator',
          email: 'admin@sheintoyou.com',
          password: adminPassword,
          role: 'super_admin',
          isActive: true,
          avatar: '',
          phone: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: null
        },
        {
          _id: 'marketing-001',
          fullName: 'Marketing Manager',
          email: 'marketing@sheintoyou.com',
          password: await bcrypt.hash('password123', 12),
          role: 'marketing',
          isActive: true,
          avatar: '',
          phone: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: null
        },
        {
          _id: 'logistics-001',
          fullName: 'Logistics Coordinator',
          email: 'logistics@sheintoyou.com',
          password: await bcrypt.hash('password123', 12),
          role: 'logistics',
          isActive: true,
          avatar: '',
          phone: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: null
        },
        {
          _id: 'treasurer-001',
          fullName: 'Financial Manager',
          email: 'treasurer@sheintoyou.com',
          password: await bcrypt.hash('password123', 12),
          role: 'treasurer',
          isActive: true,
          avatar: '',
          phone: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: null
        }
      ],
      clients: [],
      payments: [],
      settings: {
        initialized: true,
        version: '1.0.0',
        companyName: 'Shein TO YOU',
        currency: 'TND',
        advancePercentage: 30,
        lastUpdated: new Date().toISOString()
      }
    };

    // Update JSONBin
    const response = await axios.put(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': process.env.JSONBIN_API_KEY
      }
    });

    console.log('✅ Database updated successfully!');
    console.log('👥 Created users:');
    data.users.forEach(user => {
      console.log(`  - ${user.fullName} (${user.email}) - Role: ${user.role}`);
    });
    
    console.log('\n🎉 Authentication system fixed!');
    console.log('🔑 Login credentials:');
    console.log('   Email: admin@sheintoyou.com');
    console.log('   Password: AdminPassword123!');
    
  } catch (error) {
    console.error('❌ Error fixing authentication:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

fixAuthentication();
