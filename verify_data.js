// Script to verify current data in JSONBin
const https = require('https');

const API_KEY = '$2a$10$Twch63QhrK5EKGmGCrECfOxy0whAiFxFGWcDyOdWoKpuO0cpaIBge';
const BIN_ID = '68b44389d0ea881f406cf3ea';

const options = {
  hostname: 'api.jsonbin.io',
  port: 443,
  path: `/v3/b/${BIN_ID}`,
  method: 'GET',
  headers: {
    'X-Master-Key': API_KEY,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk.toString();
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(responseData);
        console.log('📊 CURRENT DATABASE STATE:');
        console.log('='.repeat(50));
        console.log(`Total Users: ${response.record?.users?.length || 0}`);
        console.log('='.repeat(30));

        if (response.record?.users && response.record.users.length > 0) {
          response.record.users.forEach((user, index) => {
            console.log(`👤 User ${index + 1}:`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${user.password ? '[HASHED/PLAIN]' : 'MISSING'}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Full Name: ${user.full_name}`);
            console.log(`   ID: ${user._id}`);
            console.log('');
          });
        } else {
          console.log('❌ No users found in database!');
          console.log('🔄 Re-creating super user...');

          // Auto-recreate super user
          const reAddScript = require('./add_super_user.js');
          console.log('✅ Super user re-added successfully!');
        }
      } catch (e) {
        console.error('❌ Error parsing database response');
      }
    } else {
      console.error(`❌ Database access failed: ${res.statusCode}`);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Connection error:', e.message);
});

req.end();