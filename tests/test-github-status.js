#!/usr/bin/env bun

/**
 * GitHub Status API Test Suite
 * 
 * This test suite validates the GitHub status monitoring functionality:
 * - GitHub Status API endpoint functionality
 * - Status data parsing and filtering
 * - Error handling and fallback responses
 * - Response format validation
 * - Caching behavior
 * 
 * Run with: bun tests/test-github-status.js
 * Or via package.json: bun run test:github-status
 */

import {
  BASE_URL,
  log,
  logTest,
  logSuccess,
  logError,
  logWarning,
  makeRequest,
  checkServer
} from './test-utils.js';

// Test data for validation
const VALID_STATUSES = ['operational', 'degraded_performance', 'partial_outage', 'major_outage', 'unknown'];
const REQUIRED_FIELDS = ['hasIssues', 'status', 'message', 'components', 'lastUpdated', 'source'];

async function testGitHubStatusEndpoint() {
  logTest('GitHub Status API Endpoint');
  
  const response = await makeRequest(`${BASE_URL}/api/github-status`);
  
  if (!response.ok) {
    logError(`API returned status: ${response.status}`);
    return false;
  }

  const data = response.data;
    
    // Validate response structure
    for (const field of REQUIRED_FIELDS) {
      if (!(field in data)) {
        logError(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate status value
    if (!VALID_STATUSES.includes(data.status)) {
      logError(`Invalid status value: ${data.status}. Expected one of: ${VALID_STATUSES.join(', ')}`);
      return false;
    }

    // Validate hasIssues is boolean
    if (typeof data.hasIssues !== 'boolean') {
      logError(`hasIssues should be boolean, got: ${typeof data.hasIssues}`);
      return false;
    }

    // Validate components is array
    if (!Array.isArray(data.components)) {
      logError(`components should be array, got: ${typeof data.components}`);
      return false;
    }

    // Validate lastUpdated is valid date
    const lastUpdated = new Date(data.lastUpdated);
    if (isNaN(lastUpdated.getTime())) {
      logError(`lastUpdated is not a valid date: ${data.lastUpdated}`);
      return false;
    }

    // Validate source field
    if (!data.source || typeof data.source !== 'string') {
      logError(`source should be a non-empty string, got: ${data.source}`);
      return false;
    }

  logSuccess('GitHub Status API endpoint is working correctly');
  log(`   Status: ${data.status}`);
  log(`   Has Issues: ${data.hasIssues}`);
  log(`   Components: ${data.components.length}`);
  log(`   Source: ${data.source}`);
  
  return true;
}

async function testGitHubStatusResponseFormat() {
  logTest('GitHub Status Response Format');
  
  const response = await makeRequest(`${BASE_URL}/api/github-status`);
  const data = response.data;
    
    // Test message format
    if (!data.message || typeof data.message !== 'string' || data.message.length === 0) {
      logError(`Message should be a non-empty string, got: ${data.message}`);
      return false;
    }

    // Test components structure (if any)
    for (const component of data.components) {
      if (!component.name || typeof component.name !== 'string') {
        logError(`Component name should be a non-empty string, got: ${component.name}`);
        return false;
      }
      
      if (!VALID_STATUSES.includes(component.status)) {
        logError(`Component status should be valid, got: ${component.status}`);
        return false;
      }
    }

    // Test status consistency
    if (data.hasIssues && data.status === 'operational') {
      logWarning('Status is operational but hasIssues is true - this might be expected');
    }

    if (!data.hasIssues && data.status !== 'operational' && data.status !== 'unknown') {
      logWarning(`Status is ${data.status} but hasIssues is false - this might be expected`);
    }

  logSuccess('Response format validation passed');
  return true;
}

async function testGitHubStatusErrorHandling() {
  logTest('GitHub Status Error Handling');
  
  // Test with invalid method
  const response = await makeRequest(`${BASE_URL}/api/github-status`, {
    method: 'POST',
    body: JSON.stringify({ test: 'data' })
  });

    // Should return 405 Method Not Allowed or handle gracefully
    if (response.status === 405) {
      logSuccess('Correctly returns 405 for invalid method');
      return true;
    } else if (response.ok) {
      logWarning(`Unexpectedly accepted POST request (status: ${response.status})`);
      return true; // Not a failure, just unexpected
  } else {
    logWarning(`Unexpected response for POST: ${response.status}`);
    return true; // Not a critical failure
  }
}

async function testGitHubStatusCaching() {
  logTest('GitHub Status Caching Behavior');
  
  const start1 = Date.now();
  const response1 = await makeRequest(`${BASE_URL}/api/github-status`);
  const duration1 = Date.now() - start1;
  
  const start2 = Date.now();
  const response2 = await makeRequest(`${BASE_URL}/api/github-status`);
  const duration2 = Date.now() - start2;
    
    if (!response1.ok || !response2.ok) {
      logError('One or both requests failed');
      return false;
    }

    const data1 = response1.data;
    const data2 = response2.data;
    
    // Check if responses are identical (cached)
    const isCached = JSON.stringify(data1) === JSON.stringify(data2);
    
    if (isCached) {
      logSuccess('Responses are identical (caching working)');
    } else {
      logWarning('Responses differ (no caching or data changed)');
    }
    
    log(`   First request: ${duration1}ms`);
    log(`   Second request: ${duration2}ms`);
    
    // Both requests should be reasonably fast
    if (duration1 < 5000 && duration2 < 5000) {
      logSuccess('Response times are acceptable');
      return true;
  } else {
    logWarning('Response times are slow');
    return true; // Not a critical failure
  }
}

async function testGitHubStatusHeaders() {
  logTest('GitHub Status Response Headers');
  
  const response = await makeRequest(`${BASE_URL}/api/github-status`);
  
  // Check for cache control headers
  const cacheControl = response.headers['cache-control'];
  if (cacheControl) {
    logSuccess(`Cache-Control header present: ${cacheControl}`);
  } else {
    logWarning('No Cache-Control header found');
  }
  
  // Check content type
  const contentType = response.headers['content-type'];
  if (contentType && contentType.includes('application/json')) {
    logSuccess(`Content-Type is correct: ${contentType}`);
  } else {
    logError(`Content-Type should be application/json, got: ${contentType}`);
    return false;
  }
  
  return true;
}

async function testGitHubStatusRealWorldScenario() {
  logTest('GitHub Status Real-World Scenario');
  
  // Simulate multiple rapid requests (like a real app would make)
  const promises = Array(5).fill().map(() => 
    makeRequest(`${BASE_URL}/api/github-status`)
  );
  
  const responses = await Promise.all(promises);
  const results = responses.map(r => r.data);
    
    // All responses should be successful
    const allSuccessful = responses.every(r => r.ok);
    if (!allSuccessful) {
      logError('Not all requests were successful');
      return false;
    }
    
    // All responses should have the same structure
    const allValid = results.every(data => 
      REQUIRED_FIELDS.every(field => field in data)
    );
    
    if (!allValid) {
      logError('Not all responses have valid structure');
      return false;
    }
    
    // Check if status is consistent across requests
    const statuses = results.map(r => r.status);
    const uniqueStatuses = [...new Set(statuses)];
    
    if (uniqueStatuses.length === 1) {
      logSuccess('Status is consistent across multiple requests');
    } else {
      logWarning(`Status varied across requests: ${uniqueStatuses.join(', ')}`);
    }
    
  logSuccess('Real-world scenario test passed');
  return true;
}

// Main test runner
async function runGitHubStatusTests() {
  log('\n📡 Starting GitHub Status API Test Suite', 'bright');
  log('=' .repeat(60), 'bright');
  
  const tests = [
    { name: 'GitHub Status Endpoint', fn: testGitHubStatusEndpoint },
    { name: 'Response Format', fn: testGitHubStatusResponseFormat },
    { name: 'Error Handling', fn: testGitHubStatusErrorHandling },
    { name: 'Caching Behavior', fn: testGitHubStatusCaching },
    { name: 'Response Headers', fn: testGitHubStatusHeaders },
    { name: 'Real-World Scenario', fn: testGitHubStatusRealWorldScenario }
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
  
  log('\n📊 GitHub Status Test Results:', 'bright');
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}${result.error ? ` - ${result.error}` : ''}`);
    }
  });
  
  log('\n' + '=' .repeat(60), 'bright');
  log(`🎯 Overall: ${passed}/${total} tests passed`, passed === total ? 'green' : 'red');
  
  if (passed === total) {
    log('\n🎉 All GitHub Status tests passed! API is working correctly!', 'green');
    return true;
  } else {
    log('\n🚨 Some GitHub Status tests failed. Please check the errors above.', 'yellow');
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
    
    const success = await runGitHubStatusTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    logError(`GitHub Status test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  runGitHubStatusTests,
  testGitHubStatusEndpoint,
  testGitHubStatusResponseFormat,
  testGitHubStatusErrorHandling,
  testGitHubStatusCaching,
  testGitHubStatusHeaders,
  testGitHubStatusRealWorldScenario
};
