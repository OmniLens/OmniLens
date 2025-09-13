-- Create repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  repo_path VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  html_url TEXT NOT NULL,
  default_branch VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_repositories_slug ON repositories(slug);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_repositories_updated_at 
    BEFORE UPDATE ON repositories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create workflows table to store workflow IDs per repository
CREATE TABLE IF NOT EXISTS workflows (
  id SERIAL PRIMARY KEY,
  repo_slug VARCHAR(255) NOT NULL,
  workflow_id INTEGER NOT NULL,
  workflow_name VARCHAR(255) NOT NULL,
  workflow_path VARCHAR(500) NOT NULL,
  workflow_state VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(repo_slug, workflow_id)
);

-- Create indexes for workflows table
CREATE INDEX IF NOT EXISTS idx_workflows_repo_slug ON workflows(repo_slug);
CREATE INDEX IF NOT EXISTS idx_workflows_workflow_id ON workflows(workflow_id);

-- Create trigger for workflows updated_at
CREATE TRIGGER update_workflows_updated_at 
    BEFORE UPDATE ON workflows 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
