#!/usr/bin/env bun

/**
 * Basic authentication test that doesn't require a session cookie
 * This tests the authentication flow and error handling
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function testAuthFlow() {
  console.log('🔐 Testing Basic Authentication Flow...\n');
  
  try {
    // Test that auth endpoint is accessible
    console.log('Testing /api/auth/session...');
    const authResponse = await fetch(`${API_BASE}/api/auth/session`);
    
    if (authResponse.ok) {
      const sessionData = await authResponse.json();
      console.log('✅ Auth session endpoint accessible');
      console.log(`   Session data: ${JSON.stringify(sessionData)}`);
    } else {
      console.log(`⚠️  Auth session endpoint returned ${authResponse.status}`);
    }
    
    // Test that protected endpoints require authentication
    console.log('\nTesting protected endpoints without authentication...');
    const protectedEndpoints = [
      '/api/repo',
      '/api/workflow/test-repo/exists'
    ];
    
    let allProtected = true;
    for (const endpoint of protectedEndpoints) {
      const response = await fetch(`${API_BASE}${endpoint}`);
      if (response.status === 401) {
        console.log(`✅ ${endpoint} - Correctly protected (401)`);
      } else {
        console.log(`❌ ${endpoint} - Expected 401, got ${response.status}`);
        allProtected = false;
      }
    }
    
    if (allProtected) {
      console.log('\n🎉 All endpoints are properly protected!');
      console.log('\nTo test with authentication:');
      console.log('1. Start the app: bun run dev');
      console.log('2. Login via the web interface');
      console.log('3. Get session cookie from browser dev tools');
      console.log('4. Run: COOKIE="your-session-cookie" bun run test:auth:valid');
      return true;
    } else {
      console.log('\n⚠️  Some endpoints are not properly protected');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function runBasicAuthTest() {
  const success = await testAuthFlow();
  process.exit(success ? 0 : 1);
}

runBasicAuthTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
