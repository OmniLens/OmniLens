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

// Initialize database on app startup
export async function ensureDatabaseInitialized() {
  if (isInitialized) {
    return;
  }

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
      
      // Check if Better Auth columns exist
      const { hasAllColumns, missingColumns } = await checkBetterAuthColumns(pool);
      if (!hasAllColumns) {
        await addBetterAuthColumns(pool, missingColumns);
      }
    }
    
    isInitialized = true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    // Don't throw - let the app continue, but log the error
  }
}

// Auto-initialize when this module is imported
ensureDatabaseInitialized();
