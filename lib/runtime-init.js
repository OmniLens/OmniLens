import { initializeDatabase, checkDatabaseHealth } from './init-db.js';

let isInitialized = false;

// Check if required Better Auth columns exist in account table
async function checkBetterAuthColumns(pool) {
  try {
    const columnInfo = await pool.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'account' 
      AND column_name IN ('accessTokenExpiresAt', 'refreshTokenExpiresAt')
    `);
    
    const existingColumns = columnInfo.rows.map(row => row.column_name);
    const requiredColumns = ['accessTokenExpiresAt', 'refreshTokenExpiresAt'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    return { hasAllColumns: missingColumns.length === 0, missingColumns };
  } catch (error) {
    console.warn('Could not check Better Auth columns:', error.message);
    return { hasAllColumns: false, missingColumns: ['accessTokenExpiresAt', 'refreshTokenExpiresAt'] };
  }
}

// Check if visibility column exists in repositories table
async function checkVisibilityColumn(pool) {
  try {
    const columnInfo = await pool.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'repositories' 
      AND column_name = 'visibility'
    `);
    
    return columnInfo.rows.length > 0;
  } catch (error) {
    console.warn('Could not check visibility column:', error.message);
    return false;
  }
}

// Add missing Better Auth columns
async function addBetterAuthColumns(pool, missingColumns) {
  try {
    for (const column of missingColumns) {
      console.log(`🔧 Adding ${column} column to account table...`);
      await pool.query(`ALTER TABLE account ADD COLUMN "${column}" TIMESTAMP WITH TIME ZONE`);
      console.log(`✅ ${column} column added`);
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to add Better Auth columns:', error.message);
    return false;
  }
}

// Add visibility column to repositories table
async function addVisibilityColumn(pool) {
  try {
    console.log('🔧 Adding visibility column to repositories table...');
    await pool.query(`ALTER TABLE repositories ADD COLUMN visibility VARCHAR(10) DEFAULT 'public'`);
    console.log('✅ visibility column added');
    return true;
  } catch (error) {
    console.error('❌ Failed to add visibility column:', error.message);
    return false;
  }
}

// Initialize database on app startup
export async function ensureDatabaseInitialized() {
  console.log('🔧 Checking database initialization...');
  
  try {
    // Check if database is accessible
    const isHealthy = await checkDatabaseHealth();
    
    if (!isHealthy) {
      console.warn('⚠️  Database not accessible, skipping initialization');
      return;
    }

    // Check if tables already exist
    const { default: pool } = await import('./init-db.js');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('repositories', 'workflows', 'user', 'session', 'account', 'verification')
      ORDER BY table_name
    `);
    
    const existingTables = result.rows.map(row => row.table_name);
    const requiredTables = ['repositories', 'workflows', 'user', 'session', 'account', 'verification'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`🔧 Initializing missing tables: ${missingTables.join(', ')}`);
      await initializeDatabase();
      console.log('✅ Database initialization complete');
    } else {
      console.log('✅ Database tables already exist');
    }
    
    // Always check for missing columns (migrations) - this runs on every app start
    // Check if Better Auth columns exist
    const { hasAllColumns, missingColumns } = await checkBetterAuthColumns(pool);
    if (!hasAllColumns) {
      console.log('🔧 Adding missing Better Auth columns...');
      await addBetterAuthColumns(pool, missingColumns);
    }
    
    // Check if visibility column exists in repositories table
    const hasVisibilityColumn = await checkVisibilityColumn(pool);
    if (!hasVisibilityColumn) {
      console.log('🔧 Adding missing visibility column...');
      await addVisibilityColumn(pool);
    }
    
    console.log('✅ Database migration checks completed');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    // Don't throw - let the app continue, but log the error
  }
}

// Note: Auto-initialization removed to prevent running on every request
// Database initialization should be handled explicitly in application startup
// or through the setup scripts in the scripts/ directory
