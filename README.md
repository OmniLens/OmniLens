# 👁️ OmniLens

<a href="https://vercel.com/oss">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" />
</a>
<br />
<br />

An intelligent dashboard that transforms GitHub Actions chaos into actionable insights. OmniLens gives you complete visibility into your CI/CD pipeline health, helping you identify bottlenecks, track success rates, and optimize your development workflow. Just connect your repositories and instantly see which workflows are failing, when they're running, and how they're performing over time.

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
- **Tenki Cloud**: GitHub Action runners for CI/CD

## 📊 Data Sources

The dashboard integrates multiple data sources:
- **GitHub Actions API**: Fetches workflow runs, repository info, and workflow definitions
- **PostgreSQL Database**: Stores repository metadata and workflow persistence
- **Real-time Validation**: Repository validation before adding to dashboard

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL (any installation method)
- GitHub Personal Access Token with `repo` scope

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/omnilens.git
   cd omnilens
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or npm install
   ```

3. **Set up PostgreSQL**
   
   The setup script automatically detects your PostgreSQL installation:
   ```bash
   bun run setup
   ```
   
   This works with any PostgreSQL installation:
   - Homebrew: `brew install postgresql`
   - Ubuntu/Debian: `sudo apt install postgresql postgresql-contrib`
   - Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`
   - Postgres.app (macOS): Download from [postgresapp.com](https://postgresapp.com/)

4. **Configure environment variables**
   
   Create a `.env` file:
   ```bash
   # GitHub Configuration
   GITHUB_TOKEN=your_github_personal_access_token
   GITHUB_CLIENT_ID=your_github_oauth_app_client_id
   GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
   
   # Authentication
   BETTER_AUTH_SECRET=your_random_secret_key_here
   BETTER_AUTH_URL=http://localhost:3000
   
   # Database (adjust if needed)
   DB_USER=your_db_user
   DB_HOST=localhost
   DB_NAME=omnilens
   DB_PASSWORD=your_db_password
   DB_PORT=5432
   
   # Production Database (for managed services like AWS RDS, Google Cloud SQL, etc.)
   # SSL is automatically enabled in production (NODE_ENV=production)
   # For custom SSL settings, you can override with:
   # DB_SSL=true
   # DB_SSL_REJECT_UNAUTHORIZED=false
   ```

5. **Set up GitHub OAuth App**
   
   - Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
   - Create a new OAuth App with:
     - Homepage URL: `http://localhost:3000`
     - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
   - Copy the Client ID and Client Secret to your `.env`

6. **Start the development server**
   ```bash
   bun dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

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
cp .env.example .env
```

Update `.env` with your GitHub token and database configuration:
- Add your GitHub Personal Access Token
- Configure your database connection details

### 2. Install Dependencies

```bash
bun install
```

### 3. Setup Database

**For local development:**
```bash
bun run setup
```

**For deployment:**
Database tables are automatically created when the application starts.

### 4. Start Development Server

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
3. **GitHub token**: Configured in `.env`
4. **Environment variables**: All required variables set

For detailed testing information, see [`tests/README.md`](tests/README.md).

## 🚀 API Endpoints

### Repository Management
- `GET /api/repo` - List all repositories for authenticated user
- `POST /api/repo/add` - Add a new repository to dashboard
- `POST /api/repo/validate` - Validate repository access and workflows
- `GET /api/repo/[slug]` - Get specific repository details
- `DELETE /api/repo/[slug]` - Remove repository from dashboard

### Workflow Data
- `GET /api/workflow/[slug]` - Get workflows for repository (no date = list workflows)
- `GET /api/workflow/[slug]?date=YYYY-MM-DD` - Get workflow runs for specific date
- `GET /api/workflow/[slug]/overview` - Get daily metrics overview with statistics
- `GET /api/workflow/[slug]/overview?date=YYYY-MM-DD` - Get overview for specific date
- `GET /api/workflow/[slug]/exists` - Check if workflows exist in database

### Authentication
- `GET /api/auth/[...auth]` - Authentication endpoints (login, logout, session management)
- `POST /api/auth/[...auth]` - Authentication actions (login, logout, session refresh)

### Admin Management
- `GET /api/admin/user-ids` - Get all user IDs in the system (requires authentication)
- `GET /api/admin/users` - Get all users (requires admin token)
- `GET /api/admin/users?userId=id` - Get specific user information (requires admin token)
- `GET /api/admin/users?includeStats=true` - Get users with repository and workflow counts (requires admin token)

### Health & Monitoring
- `GET /api/health` - System health check endpoint (no authentication required)

## 🎨 UI Components

- **Repository Cards**: Display repository info with basic metrics
- **Workflow Cards**: Show individual workflow runs with status indicators
- **Daily Metrics**: Basic analytics with pie charts and bar charts
- **Date Picker**: Calendar interface for date selection
- **Compact Metrics**: Simple overview of repository activity
