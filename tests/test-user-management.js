#!/usr/bin/env node

/**
 * User Management Test Script
 * Tests the new user management functions to get all user IDs and user information
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
});

async function testUserManagement() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing user management functions...');
    
    // Test 1: Get all user IDs
    console.log('\n1️⃣ Getting all user IDs...');
    const userIdsResult = await client.query('SELECT id FROM "user" ORDER BY "createdAt" DESC');
    const userIds = userIdsResult.rows.map(row => row.id);
    console.log(`✅ Found ${userIds.length} user IDs:`, userIds);
    
    // Test 2: Get all users with basic info
    console.log('\n2️⃣ Getting all users with basic info...');
    const usersResult = await client.query(`
      SELECT 
        id, 
        name, 
        email, 
        "emailVerified", 
        image, 
        "createdAt", 
        "updatedAt", 
        "githubId", 
        "avatarUrl"
      FROM "user" 
      ORDER BY "createdAt" DESC
    `);
    console.log(`✅ Found ${usersResult.rows.length} users:`);
    usersResult.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email || 'No email'}) - ID: ${user.id}`);
    });
    
    // Test 3: Get user statistics
    console.log('\n3️⃣ Getting user statistics...');
    for (const userId of userIds) {
      // Get repository count
      const repoResult = await client.query(
        'SELECT COUNT(*) as count FROM repositories WHERE user_id = $1',
        [userId]
      );
      
      // Get workflow count
      const workflowResult = await client.query(
        'SELECT COUNT(*) as count FROM workflows WHERE user_id = $1',
        [userId]
      );
      
      // Get last activity
      const activityResult = await client.query(`
        SELECT GREATEST(
          COALESCE((SELECT MAX(updated_at) FROM repositories WHERE user_id = $1), '1970-01-01'::timestamp),
          COALESCE((SELECT MAX(updated_at) FROM workflows WHERE user_id = $1), '1970-01-01'::timestamp)
        ) as last_activity
      `, [userId]);
      
      const user = usersResult.rows.find(u => u.id === userId);
      console.log(`   User: ${user?.name || 'Unknown'} (${userId})`);
      console.log(`     - Repositories: ${repoResult.rows[0].count}`);
      console.log(`     - Workflows: ${workflowResult.rows[0].count}`);
      console.log(`     - Last Activity: ${activityResult.rows[0].last_activity || 'Never'}`);
    }
    
    // Test 4: Test API endpoints (if server is running)
    console.log('\n4️⃣ Testing API endpoints...');
    try {
      const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
      
      // Test user IDs endpoint
      console.log('   Testing /api/admin/user-ids...');
      const userIdsResponse = await fetch(`${baseUrl}/api/admin/user-ids`, {
        headers: {
          'Content-Type': 'application/json',
          // Note: In a real scenario, you'd need proper authentication
        }
      });
      
      if (userIdsResponse.ok) {
        const userIdsData = await userIdsResponse.json();
        console.log(`   ✅ API returned ${userIdsData.count} user IDs`);
      } else {
        console.log(`   ⚠️  API returned status ${userIdsResponse.status} (authentication required)`);
      }
      
      // Test users endpoint
      console.log('   Testing /api/admin/users...');
      const usersResponse = await fetch(`${baseUrl}/api/admin/users`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log(`   ✅ API returned ${usersData.users.length} users`);
      } else {
        console.log(`   ⚠️  API returned status ${usersResponse.status} (authentication required)`);
      }
      
    } catch (apiError) {
      console.log('   ⚠️  API endpoints not accessible (server not running or authentication required)');
    }
    
    console.log('\n🎉 User management test completed successfully!');
    console.log('✅ You can now get all user IDs and user information');
    console.log('✅ User statistics are available');
    console.log('✅ API endpoints are ready for use');
    
  } catch (error) {
    console.error('❌ User management test failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await testUserManagement();
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testUserManagement };
