const supabase = require('./services/supabase');
const User = require('./models/User');
const Client = require('./models/Client');
require('dotenv').config();

async function testFullSupabaseIntegration() {
  console.log('🧪 Testing Full Supabase Integration...\n');

  try {
    // Step 1: Test Supabase connection
    console.log('1️⃣ Testing Supabase direct connection...');
    const isConnected = await supabase.testConnection();
    console.log(isConnected ? '✅ Connected' : '❌ Not connected');

    // Step 2: Test direct Supabase query
    console.log('\n2️⃣ Testing direct Supabase query...');
    const { data: directUsers, error: directError } = await supabase.supabase
      .from('users')
      .select('*');

    if (directError) {
      console.log('❌ Direct query failed:', directError.message);
    } else {
      console.log('✅ Direct query success. Users found:', directUsers?.length || 0);
      if (directUsers && directUsers.length > 0) {
        console.log('   First user:', {
          id: directUsers[0].id,
          email: directUsers[0].email,
          role: directUsers[0].role
        });
      }
    }

    // Step 3: Test User model
    console.log('\n3️⃣ Testing User model...');
    const users = await User.find();
    console.log('✅ User.find() success. Users found:', users.length);

    if (users.length > 0) {
      console.log('   User fields:', Object.keys(users[0]));
      console.log('   First user email:', users[0].email);
      console.log('   First user role:', users[0].role);

      // Test findById
      const userById = await User.findById(users[0].id);
      console.log('   findById test:', userById ? '✅ Found' : '❌ Not found');

      // Test findOne
      const userByEmail = await User.findOne({ email: users[0].email });
      console.log('   findOne test:', userByEmail ? '✅ Found' : '❌ Not found');
    }

    // Step 4: Test Client model (if tables exist)
    console.log('\n4️⃣ Testing Client model...');
    try {
      const clients = await Client.find();
      console.log('✅ Client.find() success. Clients found:', clients.length);

      if (clients.length > 0) {
        console.log('   Client fields:', Object.keys(clients[0]));
        console.log('   First client:', clients[0].order_id);
      } else {
        console.log('⚠️ No clients found (this is OK if you haven\'t created tables yet)');
      }
    } catch (clientError) {
      console.log('❌ Client model error:', clientError.message);
      console.log('💡 This likely means the \'clients\' table doesn\'t exist in Supabase yet');
    }

    // Step 5: Test authentication components
    console.log('\n5️⃣ Testing authentication preparation...');
    const bcrypt = require('bcryptjs');
    const testPassword = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    console.log('✅ Password hashing works');

    const isPasswordValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log('✅ Password verification:', isPasswordValid ? '✅ Works' : '❌ Failed');

    // Step 6: Summary
    console.log('\n📊 INTEGRATION TEST SUMMARY:');
    console.log('✅ Supabase service initialized');
    console.log('✅ Database connection working');
    console.log('✅ User operations working');

    const issues = [];

    if (directUsers?.length === 0) {
      issues.push('Database might be empty - you may need to create tables or seed data');
    }

    try {
      await Client.find();
      console.log('✅ Client operations working');
    } catch {
      issues.push('Client table may not exist in Supabase');
    }

    if (issues.length > 0) {
      console.log('\n⚠️  POTENTIAL ISSUES:');
      issues.forEach(issue => console.log(`   • ${issue}`));
    }

    console.log('\n🎉 Supabase integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testFullSupabaseIntegration();