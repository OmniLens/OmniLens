#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findPostgreSQLCommands() {
  const commonPaths = [
    '/usr/bin',
    '/usr/local/bin',
    '/opt/homebrew/bin',
    '/usr/local/pgsql/bin',
    '/Applications/Postgres.app/Contents/Versions/latest/bin'
  ];

  const commands = ['psql', 'createdb', 'pg_isready'];
  const foundCommands = {};

  // Try to find commands in PATH first
  for (const cmd of commands) {
    try {
      const result = execSync(`which ${cmd}`, { encoding: 'utf8', stdio: 'pipe' });
      if (result.trim()) {
        foundCommands[cmd] = cmd;
        continue;
      }
    } catch (e) {
      // Command not found in PATH
    }

    // Try common paths with version suffixes
    let found = false;
    for (const path of commonPaths) {
      // Try without version suffix
      try {
        execSync(`test -f ${path}/${cmd}`, { stdio: 'pipe' });
        foundCommands[cmd] = `${path}/${cmd}`;
        found = true;
        break;
      } catch (e) {
        // Try with common version suffixes
        for (const version of ['17', '16', '15', '14', '13']) {
          try {
            execSync(`test -f ${path}/${cmd}-${version}`, { stdio: 'pipe' });
            foundCommands[cmd] = `${path}/${cmd}-${version}`;
            found = true;
            break;
          } catch (e) {
            // Continue searching
          }
        }
        if (found) break;
      }
    }

    if (!found) {
      log(`Error: Could not find PostgreSQL command '${cmd}'`, 'red');
      log('Please ensure PostgreSQL is installed and accessible.', 'yellow');
      log('Common installation methods:', 'blue');
      log('  • Homebrew: brew install postgresql', 'blue');
      log('  • Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib', 'blue');
      log('  • CentOS/RHEL: sudo yum install postgresql postgresql-server', 'blue');
      log('  • Postgres.app (macOS): https://postgresapp.com/', 'blue');
      process.exit(1);
    }
  }

  return foundCommands;
}

function runCommand(command, description) {
  try {
    log(`${description}...`, 'blue');
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

async function setupDatabase() {
  log('🔧 Setting up OmniLens database...', 'blue');

  // Find PostgreSQL commands
  const pgCommands = findPostgreSQLCommands();
  log('✅ Found PostgreSQL installation', 'green');

  // Check if PostgreSQL is running
  const pgReadyResult = runCommand(
    `${pgCommands.pg_isready} -q`,
    'Checking PostgreSQL status'
  );

  if (!pgReadyResult.success) {
    log('❌ PostgreSQL is not running or not accessible', 'red');
    log('Please start PostgreSQL and try again.', 'yellow');
    log('Common commands to start PostgreSQL:', 'blue');
    log('  • Homebrew: brew services start postgresql', 'blue');
    log('  • Ubuntu/Debian: sudo systemctl start postgresql', 'blue');
    log('  • CentOS/RHEL: sudo systemctl start postgresql', 'blue');
    log('  • Postgres.app: Just launch the app', 'blue');
    process.exit(1);
  }

  log('✅ PostgreSQL is running', 'green');

  // Check if database exists
  const dbCheckResult = runCommand(
    `${pgCommands.psql} -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'omnilens';"`,
    'Checking if database exists'
  );

  if (dbCheckResult.success && dbCheckResult.output.trim() === '1') {
    log('✅ Database "omnilens" already exists', 'green');
  } else {
    // Create database
    const createDbResult = runCommand(
      `${pgCommands.createdb} omnilens`,
      'Creating database "omnilens"'
    );

    if (!createDbResult.success) {
      log('❌ Failed to create database', 'red');
      log(`Error: ${createDbResult.error}`, 'red');
      process.exit(1);
    }

    log('✅ Created database "omnilens"', 'green');
  }

  // Run schema script
  const schemaPath = join(projectRoot, 'lib', 'schema.sql');
  const schemaResult = runCommand(
    `${pgCommands.psql} -d omnilens -f "${schemaPath}"`,
    'Creating database tables and indexes'
  );

  if (!schemaResult.success) {
    log('❌ Failed to create database schema', 'red');
    log(`Error: ${schemaResult.error}`, 'red');
    process.exit(1);
  }

  // Count warnings vs errors in schema output
  const output = schemaResult.output;
  const errorLines = output.split('\n').filter(line => line.includes('ERROR:'));
  const noticeLines = output.split('\n').filter(line => line.includes('NOTICE:'));

  if (errorLines.length > 0) {
    // Check if errors are just about existing triggers (which is expected)
    const triggerErrors = errorLines.filter(line => line.includes('already exists'));
    if (triggerErrors.length === errorLines.length) {
      log('✅ Database schema is up to date', 'green');
    } else {
      log('⚠️  Some schema errors occurred:', 'yellow');
      errorLines.forEach(line => log(`  ${line}`, 'yellow'));
    }
  } else {
    log('✅ Database schema created successfully', 'green');
  }

  if (noticeLines.length > 0) {
    log('ℹ️  Some tables already existed (this is normal)', 'blue');
  }

  // Verify tables exist
  const tablesResult = runCommand(
    `${pgCommands.psql} -d omnilens -tAc "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"`,
    'Verifying database tables'
  );

  if (tablesResult.success) {
    const tables = tablesResult.output.trim().split('\n').filter(Boolean);
    const expectedTables = ['account', 'repositories', 'session', 'user', 'verification', 'workflows'];
    const missingTables = expectedTables.filter(table => !tables.includes(table));

    if (missingTables.length === 0) {
      log('✅ All required tables created:', 'green');
      tables.forEach(table => log(`  • ${table}`, 'green'));
    } else {
      log('❌ Missing tables:', 'red');
      missingTables.forEach(table => log(`  • ${table}`, 'red'));
      process.exit(1);
    }
  }

  log('\n🎉 Database setup complete!', 'green');
}

// Run the setup
setupDatabase().catch(error => {
  log(`❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
});
