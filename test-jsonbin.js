// Test JSONBin Connection
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3/b';
const JSONBIN_API_KEY = '$2a$10$Twch63QhrK5EKGmGCrECfOxy0whAiFxFGWcDyOdWoKpuO0cpaIBge';
const JSONBIN_BIN_ID = '68b334bdd0ea881f406bf592';

async function testConnection() {
  console.log('🔄 Testing JSONBin connection...\n');

  try {
    // Test with API key
    console.log('📡 Testing with API key...');
    const response1 = await fetch(`${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY,
        'X-Bin-Versioning': 'false'
      }
    });

    console.log(`🔑 API Key Test - Status: ${response1.status}`);
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ API Key: Working!');
      console.log('📊 Data:', data1.record ? 'Found data' : 'Empty data');
      return;
    }

    // Test public access
    console.log('\n🌐 Testing public access...');
    const response2 = await fetch(`${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`🗓️ Public Access Test - Status: ${response2.status}`);
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Public access: Working!');
      console.log('📊 Data:', data2.record ? 'Found data' : 'Empty data');
    } else {
      console.log('❌ Public access: Failed');
      console.log('🔧 Solutions:');
      console.log('   1. Make your bin PUBLIC in JSONBin settings');
      console.log('   2. Check API key permissions');
      console.log('   3. Verify bin ID is correct');
    }

  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('🌐 Check your internet connection');
  }
}

testConnection();