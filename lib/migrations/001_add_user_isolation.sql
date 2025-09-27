-- Migration: Add user isolation to repositories and workflows tables
-- This migration adds user_id columns and proper foreign key constraints

-- Step 1: Add user_id column to repositories table
ALTER TABLE repositories ADD COLUMN user_id TEXT;

-- Step 2: Add user_id column to workflows table  
ALTER TABLE workflows ADD COLUMN user_id TEXT;

-- Step 3: Create temporary user for existing data (if any)
-- This is a safety measure - in production you might want to handle this differently
INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
SELECT 
    'migration-user-' || extract(epoch from now())::text || '-' || floor(random() * 1000)::text,
    'Migration User',
    'migration@example.com',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "user" LIMIT 1);

-- Step 4: Update existing repositories to have a user_id
-- This assigns all existing repositories to the first available user
UPDATE repositories 
SET user_id = (SELECT id FROM "user" ORDER BY "createdAt" ASC LIMIT 1)
WHERE user_id IS NULL;

-- Step 5: Update existing workflows to have a user_id
-- This assigns all existing workflows to the first available user
UPDATE workflows 
SET user_id = (SELECT id FROM "user" ORDER BY "createdAt" ASC LIMIT 1)
WHERE user_id IS NULL;

-- Step 6: Make user_id columns NOT NULL after populating them
ALTER TABLE repositories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE workflows ALTER COLUMN user_id SET NOT NULL;

-- Step 7: Add foreign key constraints
ALTER TABLE repositories ADD CONSTRAINT fk_repositories_user_id 
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE workflows ADD CONSTRAINT fk_workflows_user_id 
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- Step 8: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);

-- Step 9: Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_repositories_user_slug ON repositories(user_id, slug);
CREATE INDEX IF NOT EXISTS idx_workflows_user_repo ON workflows(user_id, repo_slug);

-- Step 10: Update the unique constraint on repositories to include user_id
-- This allows the same repository slug to exist for different users
ALTER TABLE repositories DROP CONSTRAINT IF EXISTS repositories_slug_key;
ALTER TABLE repositories ADD CONSTRAINT repositories_user_slug_unique 
    UNIQUE (user_id, slug);

-- Step 11: Update the unique constraint on workflows to include user_id
-- This allows the same workflow to exist for different users
ALTER TABLE workflows DROP CONSTRAINT IF EXISTS workflows_repo_slug_workflow_id_key;
ALTER TABLE workflows ADD CONSTRAINT workflows_user_repo_workflow_unique 
    UNIQUE (user_id, repo_slug, workflow_id);
