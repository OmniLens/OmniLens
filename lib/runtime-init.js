import { initializeDatabase, checkDatabaseHealth } from './init-db.js';

let isInitialized = false;

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
    
    if (missingTables.length === 0) {
      console.log('✅ Database tables already exist');
      isInitialized = true;
      return;
    }

    console.log(`🔧 Initializing missing tables: ${missingTables.join(', ')}`);
    await initializeDatabase();
    console.log('✅ Database initialization complete');
    isInitialized = true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    // Don't throw - let the app continue, but log the error
  }
}

// Auto-initialize when this module is imported
ensureDatabaseInitialized();
