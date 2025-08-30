const axios = require('axios');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugLogin() {
  console.log('🔍 Debugging login process...');
  
  try {
    // First, check what's in the database
    console.log('\n1️⃣ Checking database contents...');
    const dbResponse = await axios.get(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': process.env.JSONBIN_API_KEY,
        'X-Bin-Meta': false
      }
    });
    
    const users = dbResponse.data.users || [];
    console.log(`Found ${users.length} users in database`);
    
    const adminUser = users.find(u => u.email === 'admin@sheintoyou.com');
    if (adminUser) {
      console.log('✅ Admin user found in database');
      console.log('   Email:', adminUser.email);
      console.log('   Role:', adminUser.role);
      console.log('   Active:', adminUser.isActive);
      console.log('   Password hash:', adminUser.password.substring(0, 20) + '...');
      
      // Test password comparison
      console.log('\n2️⃣ Testing password comparison...');
      const isMatch = await bcrypt.compare('AdminPassword123!', adminUser.password);
      console.log('Password match:', isMatch ? '✅ YES' : '❌ NO');
      
      if (!isMatch) {
        console.log('\n🔧 Creating new password hash...');
        const newHash = await bcrypt.hash('AdminPassword123!', 12);
        console.log('New hash:', newHash.substring(0, 20) + '...');
        
        // Update the user with correct password
        adminUser.password = newHash;
        dbResponse.data.users = users.map(u => u.email === 'admin@sheintoyou.com' ? adminUser : u);
        
        await axios.put(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, dbResponse.data, {
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': process.env.JSONBIN_API_KEY
          }
        });
        
        console.log('✅ Password updated in database');
      }
    } else {
      console.log('❌ Admin user not found in database');
    }
    
    // Test login API
    console.log('\n3️⃣ Testing login API...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@sheintoyou.com',
      password: 'AdminPassword123!'
    });
    
    console.log('✅ Login API successful!');
    console.log('User:', loginResponse.data.user.fullName);
    console.log('Role:', loginResponse.data.user.role);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

debugLogin();
