// Script to create and populate fresh JSONBin bin
// Usage: node create_fresh_jsonbin.js <new_bin_id>
// Example: node create_fresh_jsonbin.js 68b36122d0ea881f406c34d6

const API_KEY = '$2a$10$Twch63QhrK5EKGmGCrECfOxy0whAiFxFGWcDyOdWoKpuO0cpaIBge'; // Your API key

// Fresh data structure (empty)
const FRESH_DATA = {
  users: [],
  clients: [],
  payments: [],
  settings: {
    initialized: true,
    version: "1.0.0"
  }
};

// Get bin ID from command line arguments
const BIN_ID = process.argv[2];

if (!BIN_ID) {
  console.error('❌ Please provide the new bin ID as an argument.');
  console.error('Example: node create_fresh_jsonbin.js 68b36122d0ea881f406c34d6');
  process.exit(1);
}

// Function to populate bin with fresh data
const populateBin = async (binId, data) => {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'X-Master-Key': API_KEY,
        'Content-Type': 'application/json',
        'X-Bin-Versioning': 'false'  // Disable versioning
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      console.log(`✅ Successfully populated bin ${binId} with fresh data`);
      console.log('Fresh bin is ready for the project!');
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to populate bin: ${response.status} ${response.statusText}`);
      console.error('Response:', errorText);
    }
  } catch (error) {
    console.error(`Error populating bin ${binId}:`, error.message);
  }
};

// Populate the bin
populateBin(BIN_ID, FRESH_DATA);