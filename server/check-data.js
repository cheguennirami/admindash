const supabase = require('./services/supabase');
require('dotenv').config();

async function checkData() {
  try {
    console.log('🔍 Checking Supabase data...');

    const { data, error } = await supabase.supabase
      .from('users')
      .select('*');

    if (error) {
      throw error;
    }

    console.log('📊 Current Supabase Data:');
    console.log('Users count:', data?.length || 0);

    if (data && data.length > 0) {
      data.forEach((user, i) => {
        console.log(`User ${i+1}:`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Password hash: ${user.password_hash?.substring(0, 20)}...`);
        console.log('');
      });
    }

    console.log('✅ Data check complete');

  } catch (error) {
    console.error('❌ Error checking data:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

checkData();
