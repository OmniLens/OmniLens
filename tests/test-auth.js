#!/usr/bin/env bun

/**
 * Test script to verify API authentication is working
 * This tests that protected endpoints return 401 when not authenticated
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

const endpoints = [
  '/api/repo',
  '/api/repo/add',
  '/api/repo/validate',
  '/api/repo/test-repo',
  '/api/workflow/test-repo',
  '/api/workflow/test-repo/overview',
  '/api/workflow/test-repo/exists'
];

async function testEndpoint(endpoint) {
  try {
    console.log(`Testing ${endpoint}...`);
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: endpoint.includes('/add') || endpoint.includes('/validate') ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: endpoint.includes('/add') ? JSON.stringify({
        repoPath: 'test/test',
        displayName: 'Test',
        htmlUrl: 'https://github.com/test/test',
        defaultBranch: 'main'
      }) : endpoint.includes('/validate') ? JSON.stringify({
        repoUrl: 'https://github.com/test/test'
      }) : undefined
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
  console.log('🔐 Testing API Authentication...\n');
  
  const results = await Promise.all(endpoints.map(testEndpoint));
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
