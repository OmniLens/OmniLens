[26 tools called]

## End-to-End Understanding of OmniLens

I have completed a comprehensive review of your OmniLens codebase and now have an in-depth understanding of how it functions. Here's my analysis:

## **Application Architecture Overview**

**OmniLens** is a Next.js application that provides a dashboard for monitoring GitHub Actions workflows across multiple repositories. It uses modern web technologies and follows a well-structured architecture.

## **Core Technology Stack**

- **Frontend**: Next.js 14.2.0 (App Router), React 18.2.0, TypeScript 5.9.2
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: TanStack React Query for server state, Nuqs for URL state
- **Authentication**: Better Auth with GitHub OAuth
- **Database**: PostgreSQL with custom schema management
- **Error Monitoring**: Sentry integration
- **Package Manager**: Bun

## **Database Schema & Data Flow**

### **Database Structure**
- **`user`**: Better Auth user management (GitHub OAuth integration)
- **`repositories`**: User-added GitHub repositories with metadata
- **`workflows`**: GitHub Actions workflows per repository
- **`session`** & **`account`**: Better Auth session management
- **`verification`**: Email verification tokens

### **Data Relationships**
- Users can add multiple repositories (one-to-many)
- Each repository can have multiple workflows (one-to-many)
- Workflows are linked to specific repositories and users
- Session management through Better Auth

## **Authentication Flow**

1. **OAuth Integration**: Users authenticate via GitHub OAuth through Better Auth
2. **Token Storage**: GitHub access tokens stored in Better Auth's account table
3. **Session Management**: JWT-based sessions with 7-day expiry
4. **API Protection**: All repository and workflow endpoints require authentication via middleware

## **Core User Journey**

### **1. User Registration/Login**
- Redirects to GitHub OAuth
- Better Auth handles user creation/session management
- Stores GitHub access token for API access

### **2. Repository Management**
- Users can add GitHub repositories via owner/repo format or full URL
- Repository validation against GitHub API using user's token
- Stores repository metadata (slug, display name, avatar, branch info)
- Prevents duplicate repositories per user

### **3. Dashboard Overview**
- Displays all user repositories in a grid layout
- Shows compact metrics for each repository (workflow counts, success rates)
- Real-time status indicators (errors, activity, workflow states)

### **4. Repository Detail View**
- Individual repository dashboard with date picker
- Displays workflow definitions and their run history
- Shows daily metrics and health status comparisons
- Hourly breakdown of workflow activity

## **GitHub Integration**

### **API Communication**
- Uses GitHub REST API v2022-11-28
- Authenticated requests using user's GitHub token
- Handles pagination, rate limiting, and error responses
- Caching strategy (5-minute cache for workflows, no-cache for runs)

### **Workflow Data Collection**
- Fetches active workflows from GitHub Actions API
- Retrieves workflow runs for specific dates with timezone handling
- Groups runs by workflow ID for UI display
- Stores workflow metadata in local database for performance

## **Data Caching & Performance**

### **Caching Strategy**
- **Workflows**: 10-minute stale time (don't change often)
- **Workflow Runs**: 5-minute stale time (fresher data needed)
- **Database**: Persistent storage of workflows and repository metadata
- **GitHub API**: No-cache headers for fresh data

### **Performance Optimizations**
- React Query for efficient data fetching and caching
- URL state management with Nuqs for date persistence
- Background workflow data updates
- Optimistic UI updates for user actions

## **Error Handling & Resilience**

### **Error Boundaries**
- Comprehensive error handling at API and UI levels
- Graceful degradation for network failures
- User-friendly error messages
- Proper HTTP status codes (401 for auth, 404 for not found, 500 for server errors)

### **Testing Strategy**
- Health tests for infrastructure (server, database, external APIs)
- Authentication flow validation
- Environment variable validation
- Performance baseline monitoring

## **Key Features**

1. **Multi-Repository Support**: Monitor multiple GitHub repositories in one dashboard
2. **Real-time Metrics**: Live workflow success rates and activity monitoring  
3. **Historical Analysis**: Date-based workflow run analysis with comparisons
4. **Health Monitoring**: Workflow health status tracking (improved/regressed/consistent)
5. **Responsive UI**: Modern, accessible interface with proper error states
6. **Secure**: GitHub OAuth integration with proper token management

## **Development Workflow**

1. **Setup**: Database initialization via `bun run setup`
2. **Development**: `bun run dev` with hot reload
3. **Testing**: Comprehensive test suite for health, auth, and functionality
4. **Build**: `bunx next build` for production deployment

The application demonstrates excellent separation of concerns, proper error handling, and a scalable architecture that could easily be extended to support additional CI/CD providers or enhanced analytics features.