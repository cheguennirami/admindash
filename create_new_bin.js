// Node.js script to create a new JSONBin bin
const https = require('https');

const API_KEY = '$2a$10$Twch63QhrK5EKGmGCrECfOxy0whAiFxFGWcDyOdWoKpuO0cpaIBge';
const data = JSON.stringify({
  users: [],
  clients: [],
  payments: [],
  settings: {
    initialized: true,
    version: "1.0.0"
  }
});

const options = {
  hostname: 'api.jsonbin.io',
  port: 443,
  path: '/v3/b',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Master-Key': API_KEY,
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  res.on('data', (chunk) => {
    const rawData = chunk.toString();
    console.log('Raw response:', rawData);
    try {
      const response = JSON.parse(rawData);
      console.log('✅ New bin created successfully!');
      console.log('Full response:', JSON.stringify(response, null, 2));

      if (response.id) {
        console.log('\n📝 Copy this Bin ID:', response.id);
        console.log('Run: node create_fresh_jsonbin.js', response.id);
        console.log('Then: node update_env_bin_id.js', response.id);
      } else if (response.record && response.record.id) {
        console.log('\n📝 Copy this Bin ID:', response.record.id);
        console.log('Run: node create_fresh_jsonbin.js', response.record.id);
        console.log('Then: node update_env_bin_id.js', response.record.id);
      }
    } catch (e) {
      console.error('Failed to parse response:', e.message);
      console.log('Raw response:', rawData);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error creating bin:', e.message);
});

req.write(data);
req.end();