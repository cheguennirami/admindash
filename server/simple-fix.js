const axios = require('axios');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createWorkingAuth() {
  console.log('🔧 Creating a working authentication system...');
  
  // Let's try a different approach - check if the API key is actually working
  console.log('API Key:', process.env.JSONBIN_API_KEY?.substring(0, 10) + '...');
  console.log('Bin ID:', process.env.JSONBIN_BIN_ID);
  
  try {
    // First, let's try to read the bin
    console.log('\n1️⃣ Testing JSONBin read access...');
    const readResponse = await axios.get(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': process.env.JSONBIN_API_KEY,
        'X-Bin-Meta': false
      }
    });
    
    console.log('✅ Read successful, current data:', Object.keys(readResponse.data));
    
    // Now create the users with proper hashing
    console.log('\n2️⃣ Creating users...');
    const adminPassword = await bcrypt.hash('AdminPassword123!', 12);
    
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
        }
      ],
      clients: [],
      payments: [],
      settings: {
        initialized: true,
        version: '1.0.0',
        companyName: 'Shein TO YOU',
        currency: 'TND',
        advancePercentage: 30
      }
    };
    
    // Update the bin
    console.log('\n3️⃣ Updating JSONBin...');
    const updateResponse = await axios.put(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': process.env.JSONBIN_API_KEY
      }
    });
    
    console.log('✅ Update successful!');
    
    // Verify the data was saved
    console.log('\n4️⃣ Verifying data...');
    const verifyResponse = await axios.get(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': process.env.JSONBIN_API_KEY,
        'X-Bin-Meta': false
      }
    });
    
    console.log('Users in database:', verifyResponse.data.users?.length || 0);
    if (verifyResponse.data.users?.length > 0) {
      console.log('Admin user email:', verifyResponse.data.users[0].email);
      console.log('✅ Database setup complete!');
      
      // Test password
      const testPassword = await bcrypt.compare('AdminPassword123!', verifyResponse.data.users[0].password);
      console.log('Password test:', testPassword ? '✅ PASS' : '❌ FAIL');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🚨 AUTHENTICATION ERROR: Your JSONBin API key is invalid!');
      console.log('Please check your JSONBin account and get the correct API key.');
    } else if (error.response?.status === 400) {
      console.log('\n🚨 BAD REQUEST: Your Bin ID might be incorrect!');
      console.log('Please check your JSONBin account and get the correct Bin ID.');
    }
  }
}

createWorkingAuth();
