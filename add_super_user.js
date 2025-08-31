// Script to add a super user to the existing JSONBin bin
const https = require('https');

const API_KEY = '$2a$10$Twch63QhrK5EKGmGCrECfOxy0whAiFxFGWcDyOdWoKpuO0cpaIBge';
const BIN_ID = '68b44389d0ea881f406cf3ea'; // Your current bin ID

// Data to add (one super user)
const superUserData = {
  users: [
    {
      _id: "super-admin-001",
      full_name: "Super Administrator",
      email: "admin@sheintoyou.com",
      password: "shein2024", // Changed password for security
      role: "super_admin",
      isActive: true,
      avatar: "",
      phone: "+216 12 345 678",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  clients: [],
  payments: [],
  settings: {
    initialized: true,
    version: "1.0.0"
  }
};

const data = JSON.stringify(superUserData);

const options = {
  hostname: 'api.jsonbin.io',
  port: 443,
  path: `/v3/b/${BIN_ID}`,
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-Master-Key': API_KEY,
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);

  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk.toString();
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Super user added successfully to JSONBin!');
      console.log('\n🔐 Login Credentials:');
      console.log('📧 Email: admin@sheintoyou.com');
      console.log('🔑 Password: shein2024');
      console.log('👤 Role: Super Administrator');
    } else {
      console.error('❌ Failed to add super user:', res.statusCode, responseData);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error adding super user:', e.message);
});

req.write(data);
req.end();