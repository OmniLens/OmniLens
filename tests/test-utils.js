/**
 * Shared Test Utilities
 * Common configuration, colors, and utility functions for health tests
 */

// Configuration
export const BASE_URL = 'http://localhost:3000';

// Colors for console output
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logging utilities
export function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

export function logTest(testName, status, details = '') {
  if (status === undefined) {
    // Log the test name when starting a test
    log(`🧪 Testing: ${testName}`, 'cyan');
    return;
  }
  
  const icon = status === 'PASS' ? '✅' : '❌';
  const color = status === 'PASS' ? 'green' : 'red';
  log(`${icon} ${testName} - ${status}${details ? `: ${details}` : ''}`, color);
}

export function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

export function logError(message) {
  log(`❌ ${message}`, 'red');
}

export function logWarning(message) {
  log(`🚨  ${message}`, 'yellow');
}

export function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// HTTP request utility
export async function makeRequest(url, options = {}) {
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, finalOptions);
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
      data: null
    };
  }
}

// Server health check
export async function checkServer() {
  log('🔍 Checking if server is running...', 'cyan');
  
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      log('✅ Server is running!', 'green');
      return true;
    }
  } catch (error) {
    log('❌ Server is not running. Please start the development server:', 'red');
    log('   bun run dev', 'yellow');
    return false;
  }
}

// Re-export test cases from test-cases.js
export * from './test-cases.js';
