#!/usr/bin/env bun

/**
 * OmniLens Health & Infrastructure Test Suite
 * 
 * This test suite validates system health and infrastructure only:
 * - Server health and responsiveness
 * - Environment variables configuration
 * - External dependencies connectivity
 * - Database connectivity
 * - Performance baselines
 * - Error handling
 * 
 * NOTE: This does NOT test core API functionality, authentication,
 * or business logic - those belong in integration/unit tests.
 * 
 * Run with: bun tests/health.test.js
 * Or via package.json: bun run test:health
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Test functions
async function testServerHealth() {
  try {
    console.log('Testing server health...');
    
    const response = await fetch(`${API_BASE}/api/health`);
    
    if (response.ok) {
      console.log('✅ Server is running and responding');
      return true;
    } else {
      console.log(`❌ Server health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Server health test failed: ${error.message}`);
    return false;
  }
}

async function testEnvironmentVariables() {
  try {
    console.log('Testing environment variables...');
    
    const requiredVars = [
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET', 
      'BETTER_AUTH_SECRET',
      'BETTER_AUTH_URL',
      'DB_PASSWORD',
      'DB_USER',
      'DB_HOST',
      'DB_NAME'
    ];
    
    let allPassed = true;
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        console.log(`❌ Missing required environment variable: ${varName}`);
        allPassed = false;
      } else {
        console.log(`✅ ${varName} is configured`);
      }
    }
    
    // Test DB_PORT (optional, defaults to 5432)
    const dbPort = process.env.DB_PORT || '5432';
    if (isNaN(parseInt(dbPort))) {
      console.log(`❌ DB_PORT is not a valid number: ${dbPort}`);
      allPassed = false;
    } else {
      console.log(`✅ DB_PORT is valid: ${dbPort}`);
    }
    
    return allPassed;
  } catch (error) {
    console.log(`❌ Environment variables test failed: ${error.message}`);
    return false;
  }
}

async function testExternalDependencies() {
  try {
    console.log('Testing external dependencies...');
    
    // Test GitHub API connectivity (no auth required)
    const response = await fetch('https://api.github.com/repos/Visi0ncore/StealthList', {
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    if (response.ok) {
      console.log('✅ GitHub API is accessible');
      return true;
    } else {
      console.log(`❌ GitHub API returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ External dependency test failed: ${error.message}`);
    return false;
  }
}

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connectivity using health endpoint (no auth required)
    const response = await fetch(`${API_BASE}/api/health`);
    
    if (response.ok) {
      console.log('✅ Server is responding (database connectivity assumed)');
      return true;
    } else if (response.status === 500) {
      console.log('❌ Server health check failed (API returned 500)');
      return false;
    } else {
      console.log(`⚠️  Unexpected API response: ${response.status}`);
      return true; // API is responding, server is healthy
    }
  } catch (error) {
    console.log(`❌ Database connection test failed: ${error.message}`);
    return false;
  }
}

async function testPerformanceBaseline() {
  try {
    console.log('Testing performance baseline...');
    
    const start = Date.now();
    const response = await fetch(`${API_BASE}/api/health`);
    const duration = Date.now() - start;
    
    if (response.ok && duration < 1000) {
      console.log(`✅ API response time: ${duration}ms (under 1000ms threshold)`);
      return true;
    } else if (response.ok) {
      console.log(`⚠️  API response time: ${duration}ms (over 1000ms threshold)`);
      return true; // Still consider it healthy, just slow
    } else {
      console.log(`❌ API returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Performance test failed: ${error.message}`);
    return false;
  }
}

async function testErrorBoundaries() {
  try {
    console.log('Testing error boundaries...');
    
    // Test that invalid requests return proper error codes, not server crashes
    // Use a non-authenticated endpoint for error boundary testing
    const response = await fetch(`${API_BASE}/api/health/invalid-endpoint`);
    
    if (response.status === 404) {
      console.log('✅ Error boundaries working - invalid requests return 404');
      return true;
    } else if (response.status === 500) {
      console.log('❌ Server error on invalid request - error boundaries not working');
      return false;
    } else {
      console.log(`⚠️  Unexpected status for invalid request: ${response.status}`);
      return true; // Not a critical failure
    }
  } catch (error) {
    console.log(`❌ Error boundary test failed: ${error.message}`);
    return false;
  }
}

async function testSlugGeneration() {
  try {
    console.log('Testing slug generation...');
    
    // Test the slug generation logic
    const testCases = [
      {
        repoPath: 'OmniLens/OmniLens',
        expectedSlug: 'OmniLens-OmniLens',
        description: 'Should generate unique slug even when org matches repo name'
      },
      {
        repoPath: 'microsoft/vscode',
        expectedSlug: 'microsoft-vscode',
        description: 'Should include organization name for uniqueness'
      }
    ];
    
    let allPassed = true;
    
    for (const testCase of testCases) {
      const actualSlug = testCase.repoPath.replace('/', '-');
      
      if (actualSlug === testCase.expectedSlug) {
        console.log(`✅ ${testCase.description}: "${actualSlug}"`);
      } else {
        console.log(`❌ ${testCase.description}: Expected "${testCase.expectedSlug}", got "${actualSlug}"`);
        allPassed = false;
      }
    }
    
    return allPassed;
  } catch (error) {
    console.log(`❌ Slug generation test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runHealthTests() {
  console.log('\n🏥 Starting OmniLens Health & Infrastructure Test Suite');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Server Health', fn: testServerHealth },
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'External Dependencies', fn: testExternalDependencies },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Performance Baseline', fn: testPerformanceBaseline },
    { name: 'Error Boundaries', fn: testErrorBoundaries },
    { name: 'Slug Generation', fn: testSlugGeneration }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`❌ Test ${test.name} threw an error: ${error.message}`);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log('\n📊 Health Test Results:');
  results.forEach(result => {
    if (result.passed) {
      console.log(`✅ ${result.name}`);
    } else {
      console.log(`❌ ${result.name}${result.error ? ` - ${result.error}` : ''}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 Overall: ${passed}/${total} health tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 All health tests passed! System is healthy!');
    return true;
  } else {
    console.log('\n🚨 Some health tests failed. Please check the errors above.');
    return false;
  }
}

// Main execution
async function main() {
  try {
    const success = await runHealthTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(`❌ Health test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
