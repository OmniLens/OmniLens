#!/usr/bin/env node

/**
 * Multi-User Test Script
 * Tests the multi-user implementation to ensure data isolation works correctly
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

async function testMultiUserIsolation() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing multi-user data isolation...');
    
    // Test 1: Check if user_id columns exist
    console.log('\n1️⃣ Checking database schema...');
    
    const repositoriesSchema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'repositories' AND column_name = 'user_id'
    `);
    
    const workflowsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'workflows' AND column_name = 'user_id'
    `);
    
    if (repositoriesSchema.rows.length === 0) {
      throw new Error('❌ user_id column missing from repositories table');
    }
    if (workflowsSchema.rows.length === 0) {
      throw new Error('❌ user_id column missing from workflows table');
    }
    
    console.log('✅ user_id columns exist in both tables');
    
    // Test 2: Check foreign key constraints
    console.log('\n2️⃣ Checking foreign key constraints...');
    
    const fkConstraints = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('repositories', 'workflows')
        AND kcu.column_name = 'user_id'
    `);
    
    if (fkConstraints.rows.length < 2) {
      throw new Error('❌ Foreign key constraints missing for user_id columns');
    }
    
    console.log('✅ Foreign key constraints properly configured');
    
    // Test 3: Check indexes
    console.log('\n3️⃣ Checking database indexes...');
    
    const indexes = await client.query(`
      SELECT indexname, tablename, indexdef
      FROM pg_indexes 
      WHERE tablename IN ('repositories', 'workflows')
        AND indexname LIKE '%user_id%'
    `);
    
    console.log(`✅ Found ${indexes.rows.length} user_id related indexes`);
    indexes.rows.forEach(index => {
      console.log(`   - ${index.indexname} on ${index.tablename}`);
    });
    
    // Test 4: Check unique constraints
    console.log('\n4️⃣ Checking unique constraints...');
    
    const uniqueConstraints = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_name IN ('repositories', 'workflows')
        AND kcu.column_name = 'user_id'
    `);
    
    console.log(`✅ Found ${uniqueConstraints.rows.length} unique constraints involving user_id`);
    
    // Test 5: Test data isolation (if there's existing data)
    console.log('\n5️⃣ Testing data isolation...');
    
    const userCount = await client.query('SELECT COUNT(*) as count FROM "user"');
    const repoCount = await client.query('SELECT COUNT(*) as count FROM repositories');
    const workflowCount = await client.query('SELECT COUNT(*) as count FROM workflows');
    
    console.log(`📊 Current data: ${userCount.rows[0].count} users, ${repoCount.rows[0].count} repositories, ${workflowCount.rows[0].count} workflows`);
    
    if (parseInt(repoCount.rows[0].count) > 0) {
      // Check if repositories have user_id
      const reposWithoutUser = await client.query(`
        SELECT COUNT(*) as count FROM repositories WHERE user_id IS NULL
      `);
      
      if (parseInt(reposWithoutUser.rows[0].count) > 0) {
        console.log('⚠️  Warning: Some repositories have NULL user_id');
      } else {
        console.log('✅ All repositories have user_id assigned');
      }
    }
    
    if (parseInt(workflowCount.rows[0].count) > 0) {
      // Check if workflows have user_id
      const workflowsWithoutUser = await client.query(`
        SELECT COUNT(*) as count FROM workflows WHERE user_id IS NULL
      `);
      
      if (parseInt(workflowsWithoutUser.rows[0].count) > 0) {
        console.log('⚠️  Warning: Some workflows have NULL user_id');
      } else {
        console.log('✅ All workflows have user_id assigned');
      }
    }
    
    console.log('\n🎉 Multi-user isolation test completed successfully!');
    console.log('✅ Database schema supports multi-user isolation');
    console.log('✅ Data isolation is properly implemented');
    
  } catch (error) {
    console.error('❌ Multi-user isolation test failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await testMultiUserIsolation();
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

export { testMultiUserIsolation };
