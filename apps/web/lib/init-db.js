import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

// Database connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
});

// Read the schema file
function getSchemaSQL() {
  try {
    const schemaPath = join(process.cwd(), 'lib', 'schema.sql');
    return readFileSync(schemaPath, 'utf8');
  } catch (error) {
    console.error('Error reading schema file:', error);
    throw new Error('Could not read schema.sql file');
  }
}

// Initialize database tables
export async function initializeDatabase() {
  console.log('🔧 Initializing database schema...');
  
  try {
    // Test connection first
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Get schema SQL
    const schemaSQL = getSchemaSQL();
    
    // Execute schema
    await pool.query(schemaSQL);
    console.log('✅ Database schema initialized successfully');
    
    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = result.rows.map(row => row.table_name);
    const expectedTables = ['account', 'repositories', 'session', 'user', 'verification', 'workflows'];
    const missingTables = expectedTables.filter(table => !tables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ All required tables verified:', tables.join(', '));
    } else {
      console.warn('⚠️  Missing tables:', missingTables.join(', '));
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Check if database is ready
export async function checkDatabaseHealth() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export default pool;
