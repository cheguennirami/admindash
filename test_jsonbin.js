// Test script to verify JSONBin setup
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

console.log('🧪 Testing JSONBin connection...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);

  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk.toString();
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(responseData);
        console.log('✅ JSONBin connection successful!');
        console.log('📝 Bin ID:', BIN_ID);
        console.log('👤 Users in data:', response.record?.users?.length || 0);
        console.log('📊 Sample user:', response.record.users?.[0] ?
          `Email: ${response.record.users[0].email}` :
          'No users found');
        console.log('\n🔐 Login credentials available:', response.record.users?.[0] ? 'YES' : 'NO');
      } catch (e) {
        console.error('❌ Error parsing response');
      }
    } else {
      console.error(`❌ Bin access failed: ${res.statusCode}`);
      console.error(responseData);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Connection error:', e.message);
});

req.end();