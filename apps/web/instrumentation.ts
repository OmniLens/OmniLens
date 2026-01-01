export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize database and run migrations on app startup
    try {
      // @ts-ignore - runtime-init.js is a CommonJS module without types
      const { ensureDatabaseInitialized } = await import('./lib/runtime-init.js');
      await ensureDatabaseInitialized();
      console.log('✅ Database initialization completed on app startup');
    } catch (error) {
      console.error('❌ Database initialization failed on app startup:', error instanceof Error ? error.message : String(error));
      // Don't throw - let the app continue, but log the error
    }
  }
}
