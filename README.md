# 👁️ OmniLens

A dashboard for monitoring GitHub workflow runs.

## ✨ Features

- **Live Data**: Fetches workflow data from GitHub API
- **Date Selection**: View workflow runs for any specific date
- **Workflow Management**: Simple and unified workflow monitoring
- **Review System**: Mark workflows as reviewed with persistent state
- **Metrics Overview**: Comprehensive metrics and analytics
- **Error Handling**: Proper error states when API calls fail

## 🏗️ Architecture

- **Next.js 14**: App router with React Server Components
- **TanStack Query**: Data fetching and caching
- **Tailwind CSS**: Styling and responsive design
- **TypeScript**: Type safety throughout

## 📊 Data Sources

The dashboard uses GitHub API data exclusively:
- **GitHub Actions API**: Fetches workflow runs for specified dates
- **Error Handling**: Proper error states when API is unavailable

## 🔑 API Requirements

- GitHub Personal Access Token with `repo` scope
- Repository must have GitHub Actions enabled
- Token must have access to the specified repository

## 🗄️ Database

OmniLens uses PostgreSQL to store repository and workflow data.  
The database contains two main tables:

- **`repositories`**: Stores repository information and metadata
- **`workflows`**: Stores workflow run data and metrics

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

OmniLens includes a test suite to validate system health and core functionality.

### Available Tests

- **Health Tests** (`tests/health.test.js`): Validates system health, environment variables, database connectivity, GitHub API access, and core functionality

### Running Tests

```bash
# Run health tests
bun run test:health

# Run health tests directly
bun tests/health.test.js
```

### Test Prerequisites

1. **Development server running**: `bun run dev`
2. **PostgreSQL database**: Set up and running
3. **GitHub token**: Configured in `.env.local`
4. **Environment variables**: All required variables set

For detailed testing information, see [`tests/README.md`](tests/README.md).
