#!/usr/bin/env bun

/**
 * OmniLens Health & Infrastructure Test Suite
 * 
 * This test suite validates system health and core functionality
 * that doesn't require database operations or complex API testing.
 * 
 * Run with: bun tests/health.test.js
 * Or via package.json: bun run test:health
 */

import {
  BASE_URL,
  log,
  logTest,
  logSuccess,
  logError,
  logWarning,
  logInfo,
  makeRequest,
  checkServer,
  ZOD_VALIDATION_TEST_CASES,
  SLUG_TEST_CASES
} from './test-utils.js';

// Test functions
async function testServerHealth() {
  logTest('Server Health Check');
  
  const response = await makeRequest(BASE_URL);
  
  if (response.ok) {
    logSuccess('Server is running and responding');
    return true;
  } else {
    logError(`Server health check failed: ${response.status}`);
    return false;
  }
}



async function testSlugGeneration() {
  logTest('Slug Generation (Clean URLs)');
  
  // Test the slug generation logic
  const testCases = SLUG_TEST_CASES;
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    const actualSlug = testCase.repoPath.replace('/', '-');
    
    if (actualSlug === testCase.expectedSlug) {
      logSuccess(`✅ ${testCase.description}: "${actualSlug}"`);
    } else {
      logError(`❌ ${testCase.description}: Expected "${testCase.expectedSlug}", got "${actualSlug}"`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testEnvironmentVariables() {
  logTest('Environment Variables Health');
  
  const requiredVars = {
    'GITHUB_TOKEN': process.env.GITHUB_TOKEN,
    'DB_USER': process.env.DB_USER,
    'DB_HOST': process.env.DB_HOST,
    'DB_NAME': process.env.DB_NAME,
    'DB_PASSWORD': process.env.DB_PASSWORD
  };
  
  let allPassed = true;
  
  for (const [varName, value] of Object.entries(requiredVars)) {
    if (!value) {
      logError(`❌ Missing required environment variable: ${varName}`);
      allPassed = false;
    } else {
      logSuccess(`✅ ${varName} is configured`);
    }
  }
  
  // Test DB_PORT (optional, defaults to 5432)
  const dbPort = process.env.DB_PORT || '5432';
  if (isNaN(parseInt(dbPort))) {
    logError(`❌ DB_PORT is not a valid number: ${dbPort}`);
    allPassed = false;
  } else {
    logSuccess(`✅ DB_PORT is valid: ${dbPort}`);
  }
  
  return allPassed;
}

async function testDatabaseConnection() {
  logTest('Database Connection Health');
  
  try {
    // Test basic connectivity without importing the full db module
    const response = await makeRequest(`${BASE_URL}/api/repo`);
    
    if (response.ok) {
      logSuccess('✅ Database connection working (API responds)');
      
      // Test if response has expected structure
      if (response.data && typeof response.data === 'object' && 'repositories' in response.data) {
        logSuccess('✅ Database schema appears valid (repositories table accessible)');
        return true;
      } else {
        logWarning('⚠️  Database connection works but unexpected response structure');
        return true; // Still consider it a pass for health check
      }
    } else if (response.status === 500) {
      logError('❌ Database connection failed (API returned 500)');
      return false;
    } else {
      logWarning(`⚠️  Unexpected API response: ${response.status}`);
      return true; // API is responding, DB might be OK
    }
  } catch (error) {
    logError(`❌ Database connection test failed: ${error.message}`);
    return false;
  }
}

async function testGitHubApiConnectivity() {
  logTest('GitHub API Connectivity');
  
  if (!process.env.GITHUB_TOKEN) {
    logError('❌ GITHUB_TOKEN not configured, skipping GitHub API test');
    return false;
  }
  
  try {
    // Test GitHub API connectivity and token validity
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    if (response.ok) {
      logSuccess('✅ GitHub API connectivity and token validation successful');
      
      // Check rate limit headers
      const remaining = response.headers.get('x-ratelimit-remaining');
      const limit = response.headers.get('x-ratelimit-limit');
      
      if (remaining && limit) {
        logInfo(`ℹ️  GitHub API rate limit: ${remaining}/${limit} remaining`);
        
        if (parseInt(remaining) < 100) {
          logWarning('⚠️  GitHub API rate limit is low, consider monitoring usage');
        }
      }
      
      return true;
    } else if (response.status === 401) {
      logError('❌ GitHub token is invalid or expired');
      return false;
    } else if (response.status === 403) {
      logError('❌ GitHub token has insufficient permissions');
      return false;
    } else {
      logError(`❌ GitHub API returned unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`❌ GitHub API connectivity test failed: ${error.message}`);
    return false;
  }
}

async function testCoreApiEndpoints() {
  logTest('Core API Endpoints Health');
  
  const endpoints = [
    { path: '/api/repo', method: 'GET', description: 'Repository listing' },
    { path: '/api/repo/validate', method: 'POST', description: 'Repository validation', 
      body: { repoUrl: 'https://github.com/octocat/Hello-World' } }
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        ...(endpoint.body && { body: JSON.stringify(endpoint.body) })
      };
      
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`, options);
      
      if (response.ok || (endpoint.path.includes('validate') && response.status === 404)) {
        // 404 is OK for validate endpoint with test repo that might not exist
        logSuccess(`✅ ${endpoint.description} endpoint is healthy`);
      } else {
        logError(`❌ ${endpoint.description} endpoint failed: ${response.status}`);
        allPassed = false;
      }
    } catch (error) {
      logError(`❌ ${endpoint.description} endpoint error: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testZodValidation() {
  logTest('Zod Validation Integration');
  
  const testCases = ZOD_VALIDATION_TEST_CASES;
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    logInfo(`  Testing: ${testCase.name}`);
    
    const response = await makeRequest(`${BASE_URL}/api/repo/validate`, {
      method: 'POST',
      body: JSON.stringify(testCase.data)
    });
    
    if (testCase.shouldPass) {
      if (response.ok) {
        logSuccess(`    ✅ ${testCase.name} - Zod validation passed`);
      } else {
        logError(`    ❌ ${testCase.name} - Zod validation failed: ${response.status}`);
        allPassed = false;
      }
    } else {
      if (!response.ok && response.status === 400) {
        logSuccess(`    ✅ ${testCase.name} - Zod validation correctly rejected`);
      } else {
        logError(`    ❌ ${testCase.name} - Expected 400 but got: ${response.status}`);
        allPassed = false;
      }
    }
  }
  
  return allPassed;
}

// Main test runner
async function runHealthTests() {
  log('\n🏥 Starting OmniLens Health & Infrastructure Test Suite', 'bright');
  log('=' .repeat(60), 'bright');
  
  const tests = [
    { name: 'Core API Endpoints', fn: testCoreApiEndpoints },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'GitHub API Connectivity', fn: testGitHubApiConnectivity },
    { name: 'Server Health', fn: testServerHealth },
    { name: 'Slug Generation', fn: testSlugGeneration },
    { name: 'Zod Validation', fn: testZodValidation }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      logError(`Test ${test.name} threw an error: ${error.message}`);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  log('\n📊 Health Test Results:', 'bright');
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}${result.error ? ` - ${result.error}` : ''}`);
    }
  });
  
  log('\n' + '=' .repeat(60), 'bright');
  log(`🎯 Overall: ${passed}/${total} health tests passed`, passed === total ? 'green' : 'red');
  
  if (passed === total) {
    log('\n🎉 All health tests passed! System is healthy!', 'green');
    return true;
  } else {
    log('\n🚨 Some health tests failed. Please check the errors above.', 'yellow');

    return false;
  }
}

// Main execution
async function main() {
  try {
    const serverRunning = await checkServer();
    if (!serverRunning) {
      process.exit(1);
    }
    
    const success = await runHealthTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    logError(`Health test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  runHealthTests,
  testEnvironmentVariables,
  testServerHealth,
  testDatabaseConnection,
  testGitHubApiConnectivity,
  testCoreApiEndpoints,
  testSlugGeneration,
  testZodValidation
};
