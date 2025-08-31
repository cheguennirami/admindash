// Script to update the bin ID in .env file
// Usage: node update_env_bin_id.js <new_bin_id>
// Example: node update_env_bin_id.js 68b36122d0ea881f406c34d6

const fs = require('fs');
const path = require('path');

const ENV_FILE = '.env';
const NEW_BIN_ID = process.argv[2];

if (!NEW_BIN_ID) {
  console.error('❌ Please provide the new bin ID as an argument.');
  console.error('Example: node update_env_bin_id.js 68b36122d0ea881f406c34d6');
  process.exit(1);
}

// Validate bin ID format (basic validation)
if (!/^[a-f0-9]{24}$/.test(NEW_BIN_ID)) {
  console.error('❌ Invalid bin ID format. Should be 24 hexadecimal characters.');
  process.exit(1);
}

try {
  // Read the current .env file
  const envPath = path.join(__dirname, ENV_FILE);
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Replace the bin ID
  const binIdRegex = /(REACT_APP_JSONBIN_BIN_ID=)[a-f0-9]{24}/;
  envContent = envContent.replace(binIdRegex, `$1${NEW_BIN_ID}`);

  // Write back to file
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log(`✅ Updated .env file with new bin ID: ${NEW_BIN_ID}`);
  console.log('The project is now configured to use the fresh JSONBin bin.');
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
  process.exit(1);
}