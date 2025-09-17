# 👁️ OmniLens

A dashboard for monitoring GitHub workflow runs with basic repository management.

## ✨ Features

- **Repository Management**: Add, validate, and remove GitHub repositories from dashboard
- **Workflow Monitoring**: View GitHub Actions workflow runs for specific dates
- **Date Selection**: Calendar picker to view workflow runs for any date
- **Basic Metrics**: Success rates, pass/fail counts, and runtime calculations
- **Workflow Cards**: Display individual workflow runs with status indicators
- **Database Storage**: PostgreSQL persistence for repository metadata and workflow definitions
- **Repository Validation**: GitHub API validation before adding repositories
- **Error Handling**: Basic error states for API failures and validation

## 🏗️ Architecture

- **Next.js 14**: App router with React Server Components
- **PostgreSQL**: Database for repository and workflow persistence
- **Zod**: Runtime type validation and schema validation
- **Tailwind CSS**: Styling with shadcn/ui components
- **TypeScript**: Full type safety throughout
- **Bun**: Package manager and runtime

## 📊 Data Sources

The dashboard integrates multiple data sources:
- **GitHub Actions API**: Fetches workflow runs, repository info, and workflow definitions
- **PostgreSQL Database**: Stores repository metadata and workflow persistence
- **Real-time Validation**: Repository validation before adding to dashboard

## 🔑 API Requirements

- GitHub Personal Access Token with `repo` scope
- Repository must have GitHub Actions enabled
- Token must have access to the specified repository
- PostgreSQL database for data persistence

## 🗄️ Database

OmniLens uses PostgreSQL to store repository and workflow data.  
The database contains two main tables:

- **`repositories`**: Stores repository information, metadata, and user-added repos
- **`workflows`**: Stores workflow definitions and metadata for persistence

### Database Schema

**Repositories Table:**
- `id`: Primary key
- `slug`: Unique repository identifier (owner-repo format)
- `repo_path`: Full repository path (owner/repo)
- `display_name`: Human-readable repository name
- `html_url`: GitHub repository URL
- `default_branch`: Repository's default branch
- `avatar_url`: Repository owner's avatar
- `added_at`: Timestamp when added
- `updated_at`: Last updated timestamp

**Workflows Table:**
- `id`: Primary key
- `repo_slug`: Foreign key to repositories
- `workflow_id`: GitHub workflow ID
- `workflow_name`: Workflow display name
- `workflow_path`: Workflow file path
- `workflow_state`: Active/disabled state
- `created_at`: Timestamp when first saved
- `updated_at`: Last updated timestamp

### Database Commands

**List all tables:**
```bash
psql -d omnilens -c "\dt"
```

**View table structure:**
```bash
psql -d omnilens -c "\d repositories"
psql -d omnilens -c "\d workflows"
```

**Preview table data:**
```bash
psql -d omnilens -c "SELECT * FROM repositories LIMIT 5;"
psql -d omnilens -c "SELECT * FROM workflows LIMIT 5;"
```

## 🚀 Quick Start

### 1. Environment Setup

```bash
cp .env.example .env.local
```

### 2. Configure Environment

Update `.env.local` with your GitHub token and database configuration:
- Add your GitHub Personal Access Token
- Configure your database connection details

### 3. Install Dependencies

```bash
bun install
```

### 4. Setup Database

```bash
bun run setup
```

### 5. Start Development Server

```bash
bun run dev
```

## 🧪 Testing

OmniLens includes a health test suite to validate system infrastructure and core functionality.

### Available Tests

- **Health Tests** (`tests/health.test.js`): Comprehensive system health validation including:
  - Server health check
  - Environment variables validation
  - Database connectivity testing
  - GitHub API connectivity and token validation
  - Core API endpoints health
  - Zod validation integration
  - Slug generation testing

### Running Tests

```bash
# Run health tests
bun run test:health

# Run health tests directly
bun tests/health.test.js
```

### Test Coverage

The health tests validate:
- ✅ **Server Health**: Basic server connectivity and response
- ✅ **Environment Variables**: Required environment variables validation
- ✅ **Database Connection**: Database connectivity and schema validation
- ✅ **GitHub API**: GitHub token validation and API connectivity
- ✅ **Core API Endpoints**: Basic endpoint health checks
- ✅ **Zod Validation**: Schema validation integration
- ✅ **Slug Generation**: URL slug generation logic

### Test Prerequisites

1. **Development server running**: `bun run dev`
2. **PostgreSQL database**: Set up and running
3. **GitHub token**: Configured in `.env.local`
4. **Environment variables**: All required variables set

For detailed testing information, see [`tests/README.md`](tests/README.md).

## 🚀 API Endpoints

### Repository Management
- `GET /api/repo` - List all repositories
- `POST /api/repo/add` - Add a new repository
- `POST /api/repo/validate` - Validate repository access
- `GET /api/repo/[slug]` - Get specific repository
- `DELETE /api/repo/[slug]` - Remove repository

### Workflow Data
- `GET /api/workflow/[slug]` - Get workflows for repository
- `GET /api/workflow/[slug]?date=YYYY-MM-DD` - Get workflow runs for specific date
- `GET /api/workflow/[slug]/overview` - Get daily metrics overview
- `GET /api/workflow/[slug]/exists` - Check if workflows exist in database

## 🎨 UI Components

- **Repository Cards**: Display repository info with basic metrics
- **Workflow Cards**: Show individual workflow runs with status indicators
- **Daily Metrics**: Basic analytics with pie charts and bar charts
- **Date Picker**: Calendar interface for date selection
- **Compact Metrics**: Simple overview of repository activity
