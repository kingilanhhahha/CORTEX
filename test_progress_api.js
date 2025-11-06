// Quick test script for progress API
// Run with: node test_progress_api.js

const API_BASE = 'http://localhost:5055';

async function testProgressAPI() {
  console.log('🧪 Testing Progress API...\n');

  try {
    // Test 1: Check API is running
    console.log('1. Testing API ping...');
    const pingResponse = await fetch(`${API_BASE}/api/ping`);
    if (pingResponse.ok) {
      console.log('✅ API is running');
    } else {
      console.log('❌ API not responding');
      return;
    }

    // Test 2: Get progress for a test user
    console.log('\n2. Getting progress for test user...');
    const userId = 'test_user_123';
    const getResponse = await fetch(`${API_BASE}/api/user-progress/${userId}`);
    const initialProgress = await getResponse.json();
    console.log('📊 Initial progress:', initialProgress);

    // Test 3: Save some progress
    console.log('\n3. Saving test progress...');
    const testProgress = {
      user_id: userId,
      module_id: 'mercury',
      section_id: 'section_2',
      slide_index: 2,
      progress_pct: 50
    };
    
    const saveResponse = await fetch(`${API_BASE}/api/user-progress/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProgress)
    });
    
    if (saveResponse.ok) {
      const saveResult = await saveResponse.json();
      console.log('✅ Progress saved:', saveResult);
    } else {
      console.log('❌ Failed to save progress');
    }

    // Test 4: Get updated progress
    console.log('\n4. Getting updated progress...');
    const updatedResponse = await fetch(`${API_BASE}/api/user-progress/${userId}`);
    const updatedProgress = await updatedResponse.json();
    console.log('📊 Updated progress:', updatedProgress);

    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the backend server is running:');
    console.log('   python math-cosmos-tutor-main/api/hybrid_db_server.py');
  }
}

testProgressAPI();
