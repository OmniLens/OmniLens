#!/usr/bin/env node

/**
 * Database Migration Script
 * Applies the user isolation migration to add proper multi-user support
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

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration: Add user isolation...');
    
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'lib', 'migrations', '001_add_user_isolation.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Check if migration has already been applied
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const existingMigration = await client.query(
      'SELECT version FROM schema_migrations WHERE version = $1',
      ['001_add_user_isolation']
    );
    
    if (existingMigration.rows.length > 0) {
      console.log('✅ Migration 001_add_user_isolation already applied');
      return;
    }
    
    // Execute the migration
    console.log('📝 Executing migration SQL...');
    await client.query(migrationSQL);
    
    // Record the migration as applied
    await client.query(
      'INSERT INTO schema_migrations (version) VALUES ($1)',
      ['001_add_user_isolation']
    );
    
    console.log('✅ Migration 001_add_user_isolation completed successfully!');
    console.log('🎉 Multi-user support has been enabled!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await runMigration();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runMigration };
