#!/usr/bin/env bun

/**
 * Test script to verify API works with valid authentication
 * This requires a valid session cookie to test authenticated requests
 * 
 * Usage: 
 * 1. Start the app: bun run dev
 * 2. Login via the web interface 
 * 3. Extract the session cookie from browser dev tools
 * 4. Run: COOKIE="your-session-cookie" bun tests/test-auth-valid.js
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const COOKIE = process.env.COOKIE;

if (!COOKIE) {
  console.log('❌ Please provide a session cookie via COOKIE environment variable');
  console.log('Usage: COOKIE="your-session-cookie" bun tests/test-auth-valid.js');
  console.log('\nTo get a session cookie:');
  console.log('1. Start the app: bun run dev');
  console.log('2. Login via the web interface');
  console.log('3. Open browser dev tools > Application > Cookies');
  console.log('4. Copy the session cookie value');
  console.log('5. Run: COOKIE="your-session-cookie" bun run test:auth:valid');
  process.exit(1);
}

async function testAuthenticatedEndpoint(endpoint, method = 'GET', body = null) {
  try {
    console.log(`Testing authenticated ${method} ${endpoint}...`);
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': COOKIE
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json().catch(() => ({}));
    
    if (response.status === 200 || response.status === 201) {
      console.log(`✅ ${endpoint} - Successfully authenticated (${response.status})`);
      return true;
    } else if (response.status === 401) {
      console.log(`❌ ${endpoint} - Still getting 401, check your session cookie`);
      return false;
    } else {
      console.log(`⚠️ ${endpoint} - Got ${response.status}: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${endpoint} - Error: ${error.message}`);
    return false;
  }
}

async function runAuthenticatedTests() {
  console.log('🔐 Testing API with Authentication...\n');
  
  const tests = [
    () => testAuthenticatedEndpoint('/api/repo'),
    () => testAuthenticatedEndpoint('/api/workflow/test-repo/exists')
  ];
  
  const results = await Promise.all(tests.map(test => test()));
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`\n📊 Results: ${passed}/${total} authenticated requests successful`);
  
  if (passed === total) {
    console.log('🎉 Authentication is working correctly!');
    process.exit(0);
  } else {
    console.log('⚠️  Some authenticated requests failed');
    process.exit(1);
  }
}

runAuthenticatedTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
