// Script to delete JSONBin bins
// Run with: node delete_jsonbin_bins.js

const API_KEY = '$2a$10$Twch63QhrK5EKGmGCrECfOxy0whAiFxFGWcDyOdWoKpuO0cpaIBge'; // Replace with your API key
const BIN_ID = '68b36122d0ea881f406c34d5'; // Replace with the bin ID you want to delete

const deleteBin = async (binId) => {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'DELETE',
      headers: {
        'X-Master-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log(`✅ Successfully deleted bin: ${binId}`);
    } else {
      console.log(`❌ Failed to delete bin: ${binId} - ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error deleting bin ${binId}:`, error.message);
  }
};

// Delete the current bin
deleteBin(BIN_ID);

console.log('Deletion request sent. Check your JSONBin dashboard to confirm.');