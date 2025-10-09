#!/usr/bin/env bun

/**
 * Basic authentication test that doesn't require a session cookie
 * This tests the authentication flow and error handling
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

const protectedEndpoints = [
  '/api/repo',
  '/api/workflow/test-repo/exists'
];

async function testEndpoint(endpoint) {
  try {
    console.log(`Testing ${endpoint}...`);
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json().catch(() => ({}));
    
    if (response.status === 401) {
      console.log(`✅ ${endpoint} - Correctly returns 401 Unauthorized`);
      return true;
    } else {
      console.log(`❌ ${endpoint} - Expected 401, got ${response.status}: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${endpoint} - Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🔐 Testing Basic Authentication Flow...\n');
  
  const results = await Promise.all(protectedEndpoints.map(testEndpoint));
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`\n📊 Results: ${passed}/${total} endpoints correctly protected`);
  
  if (passed === total) {
    console.log('🎉 All endpoints are properly protected with authentication!');
    process.exit(0);
  } else {
    console.log('⚠️  Some endpoints are not properly protected');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
