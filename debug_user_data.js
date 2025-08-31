// Debug script to see full user data including password
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

console.log('🔍 Debugging User Data in JSONBin...\n');

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk.toString();
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(responseData);
        console.log('📊 COMPLETE DATABASE DUMP:');
        console.log('='.repeat(50));
        console.log(JSON.stringify(response.record, null, 2));

        if (response.record?.users && response.record.users.length > 0) {
          console.log('\n🔐 AUTHENTICATION DEBUG:');
          console.log('='.repeat(30));

          const adminUser = response.record.users.find(u => u.role === 'super_admin');
          if (adminUser) {
            console.log(`👤 Admin User Found:`);
            console.log(`   ID: ${adminUser._id}`);
            console.log(`   Email: ${adminUser.email}`);
            console.log(`   Password: "${adminUser.password}"`);
            console.log(`   Password Length: ${adminUser.password ? adminUser.password.length : 0} chars`);
            console.log('\n📝 LOGIN CREDENTIALS:');
            console.log(`   Email: ${adminUser.email}`);
            console.log(`   Password: ${adminUser.password}`);
            console.log('\n✅ If login fails, verify:');
            console.log('   1. Email matches exactly');
            console.log('   2. Password matches exactly (case sensitive)');
            console.log('   3. JSONBin services are loading from correct bin');
          } else {
            console.log('❌ No super admin user found!');
          }
        } else {
          console.log('❌ No users array found!');
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