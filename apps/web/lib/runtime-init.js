import { initializeDatabase, checkDatabaseHealth } from './init-db.js';

// ============================================================================
// Initialization Guard
// ============================================================================

/**
 * Promise-based initialization guard to prevent concurrent database initializations
 * If initialization is already in progress, returns the existing promise
 * If initialization is complete, returns a resolved promise immediately
 * This prevents race conditions when ensureDatabaseInitialized() is called
 * multiple times concurrently (e.g., during app startup with multiple workers)
 */
let initializationPromise = null;
let isInitialized = false;

// ============================================================================
// Helper Functions
// ============================================================================

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

// Check if unique constraint exists on repositories table
async function checkRepositoriesUniqueConstraint(pool) {
  try {
    const constraintInfo = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints 
      WHERE table_name = 'repositories' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%user_id%slug%'
    `);
    
    return constraintInfo.rows.length > 0;
  } catch (error) {
    console.warn('Could not check repositories unique constraint:', error.message);
    return false;
  }
}

// Check if unique constraint exists on workflows table
async function checkWorkflowsUniqueConstraint(pool) {
  try {
    const constraintInfo = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints 
      WHERE table_name = 'workflows' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%user_id%repo_slug%workflow_id%'
    `);
    
    return constraintInfo.rows.length > 0;
  } catch (error) {
    console.warn('Could not check workflows unique constraint:', error.message);
    return false;
  }
}

// Add unique constraint to repositories table if it doesn't exist
async function addRepositoriesUniqueConstraint(pool) {
  try {
    console.log('🔧 Adding unique constraint to repositories table...');
    await pool.query(`ALTER TABLE repositories ADD CONSTRAINT repositories_user_id_slug_unique UNIQUE (user_id, slug)`);
    console.log('✅ Unique constraint added to repositories table');
    return true;
  } catch (error) {
    // If constraint already exists, that's fine
    if (error.message.includes('already exists')) {
      console.log('✅ Unique constraint already exists on repositories table');
      return true;
    }
    console.error('❌ Failed to add unique constraint:', error.message);
    return false;
  }
}

// Add unique constraint to workflows table if it doesn't exist
async function addWorkflowsUniqueConstraint(pool) {
  try {
    console.log('🔧 Adding unique constraint to workflows table...');
    await pool.query(`ALTER TABLE workflows ADD CONSTRAINT workflows_user_id_repo_slug_workflow_id_unique UNIQUE (user_id, repo_slug, workflow_id)`);
    console.log('✅ Unique constraint added to workflows table');
    return true;
  } catch (error) {
    // If constraint already exists, that's fine
    if (error.message.includes('already exists')) {
      console.log('✅ Unique constraint already exists on workflows table');
      return true;
    }
    console.error('❌ Failed to add unique constraint:', error.message);
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

// ============================================================================
// Main Initialization Function
// ============================================================================

/**
 * Initialize database on app startup
 * Uses a promise-based guard to prevent concurrent initializations
 * Safe to call multiple times - will only initialize once
 * @returns {Promise<void>} Promise that resolves when initialization is complete
 */
export async function ensureDatabaseInitialized() {
  // If already initialized, return immediately
  if (isInitialized) {
    return;
  }
  
  // If initialization is in progress, return the existing promise
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Start initialization and store the promise
  initializationPromise = (async () => {
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
      
      // Check if unique constraint exists on repositories table
      const hasUniqueConstraint = await checkRepositoriesUniqueConstraint(pool);
      if (!hasUniqueConstraint) {
        console.log('🔧 Adding missing unique constraint...');
        await addRepositoriesUniqueConstraint(pool);
      }
      
      // Check if unique constraint exists on workflows table
      const hasWorkflowsUniqueConstraint = await checkWorkflowsUniqueConstraint(pool);
      if (!hasWorkflowsUniqueConstraint) {
        console.log('🔧 Adding missing workflows unique constraint...');
        await addWorkflowsUniqueConstraint(pool);
      }
      
      console.log('✅ Database migration checks completed');
      
      // Mark as initialized after successful completion
      isInitialized = true;
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      // Reset promise on error so it can be retried
      initializationPromise = null;
      // Don't throw - let the app continue, but log the error
    }
  })();
  
  return initializationPromise;
}

// Note: Auto-initialization removed to prevent running on every request
// Database initialization should be handled explicitly in application startup
// or through the setup scripts in the scripts/ directory
