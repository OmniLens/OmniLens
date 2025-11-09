// External library imports
import { NextResponse } from 'next/server';

// ============================================================================
// OpenAPI Specification
// ============================================================================

/**
 * GET /api/openapi
 * 
 * Returns the OpenAPI 3.0 specification for the OmniLens API.
 * This spec can be used with Swagger UI, Redoc, or other OpenAPI tools.
 */
export async function GET() {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'OmniLens API',
      description: 'API for managing GitHub repositories and monitoring workflow runs',
      version: '1.0.0',
      contact: {
        name: 'OmniLens',
        url: 'https://github.com/omnilens/OmniLens'
      }
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    tags: [
      { name: 'Repositories', description: 'Repository management endpoints' },
      { name: 'Workflows', description: 'Workflow monitoring endpoints' },
      { name: 'Admin', description: 'Admin management endpoints' },
      { name: 'Status', description: 'Status and health check endpoints' }
    ],
    paths: {
      '/api/repo': {
        get: {
          summary: 'List all repositories for authenticated user',
          description: 'Returns a list of all repositories that the authenticated user has added to their dashboard',
          tags: ['Repositories'],
          security: [{ cookieAuth: [] }],
          responses: {
            '200': {
              description: 'Successfully retrieved repositories',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      repositories: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            slug: { type: 'string', description: 'Repository slug identifier' },
                            displayName: { type: 'string', description: 'Display name of the repository' },
                            avatarUrl: { type: 'string', nullable: true, description: 'URL to repository avatar image' },
                            htmlUrl: { type: 'string', nullable: true, description: 'URL to repository on GitHub' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized - Authentication required' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/repo/add': {
        post: {
          summary: 'Add a new repository to dashboard',
          description: 'Validates repository exists on GitHub, adds it to user\'s dashboard, and fetches initial workflow data',
          tags: ['Repositories'],
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['repoPath', 'displayName', 'htmlUrl', 'defaultBranch'],
                  properties: {
                    repoPath: { type: 'string', description: 'Repository path in owner/repo format', example: 'owner/repo' },
                    displayName: { type: 'string', description: 'Display name for the repository', example: 'My Repository' },
                    htmlUrl: { type: 'string', format: 'uri', description: 'Full GitHub URL to the repository', example: 'https://github.com/owner/repo' },
                    defaultBranch: { type: 'string', description: 'Default branch name', example: 'main' },
                    avatarUrl: { type: 'string', format: 'uri', description: 'URL to repository avatar image (optional)', example: 'https://avatars.githubusercontent.com/u/123456' }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Repository added successfully' },
            '400': { description: 'Bad request - Invalid data or maximum repository limit reached' },
            '401': { description: 'Unauthorized - GitHub token not found' },
            '403': { description: 'Forbidden - Repository access denied' },
            '404': { description: 'Repository not found on GitHub' },
            '409': { description: 'Conflict - Repository already exists in dashboard' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/repo/validate': {
        post: {
          summary: 'Validate repository access and workflows',
          description: 'Validates a GitHub repository URL, checks accessibility, and counts active workflows',
          tags: ['Repositories'],
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['repoUrl'],
                  properties: {
                    repoUrl: { type: 'string', description: 'Repository URL (full GitHub URL or owner/repo format)', example: 'https://github.com/owner/repo' }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Validation successful' },
            '400': { description: 'Bad request - Invalid repository URL format' },
            '401': { description: 'Unauthorized - GitHub token not found' },
            '403': { description: 'Forbidden - Repository or workflow access denied' },
            '404': { description: 'Repository not found or workflows not accessible' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/repo/dashboard': {
        get: {
          summary: 'Get dashboard data with workflow metrics',
          description: 'Returns all user repositories with today\'s workflow metrics, processed in parallel',
          tags: ['Repositories'],
          security: [{ cookieAuth: [] }],
          responses: {
            '200': { description: 'Successfully retrieved dashboard data' },
            '401': { description: 'Unauthorized - Authentication required' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/repo/{slug}': {
        get: {
          summary: 'Get repository by slug',
          description: 'Retrieves a specific repository by slug for the authenticated user',
          tags: ['Repositories'],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, description: 'Repository slug identifier' }
          ],
          responses: {
            '200': { description: 'Successfully retrieved repository' },
            '400': { description: 'Bad request - Invalid slug format' },
            '401': { description: 'Unauthorized - Authentication required' },
            '404': { description: 'Repository not found' },
            '500': { description: 'Internal server error' }
          }
        },
        delete: {
          summary: 'Delete repository from dashboard',
          description: 'Deletes a specific repository and its associated workflows from the user\'s dashboard',
          tags: ['Repositories'],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, description: 'Repository slug identifier' }
          ],
          responses: {
            '200': { description: 'Repository deleted successfully' },
            '400': { description: 'Bad request - Invalid slug format' },
            '401': { description: 'Unauthorized - Authentication required' },
            '404': { description: 'Repository not found' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/workflow/{slug}': {
        get: {
          summary: 'Get workflows or workflow runs for a repository',
          description: 'Gets workflows or workflow runs for a repository. Without date parameter: Returns list of active workflows (with 5-minute cache). With date parameter: Returns workflow runs for that date with overview metrics',
          tags: ['Workflows'],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, description: 'Repository slug identifier' },
            { name: 'date', in: 'query', required: false, schema: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }, description: 'Date in YYYY-MM-DD format to get workflow runs for that date' }
          ],
          responses: {
            '200': { description: 'Success' },
            '400': { description: 'Invalid request parameters' },
            '404': { description: 'Repository not found' },
            '500': { description: 'Internal server error' }
          }
        },
        put: {
          summary: 'Save workflows for a repository',
          description: 'Updates/saves workflows for a repository to the database',
          tags: ['Workflows'],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, description: 'Repository slug identifier' }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['workflows'],
                  properties: {
                    workflows: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['id', 'name', 'path', 'state'],
                        properties: {
                          id: { type: 'number', description: 'GitHub workflow ID' },
                          name: { type: 'string', description: 'Workflow name' },
                          path: { type: 'string', description: 'Workflow file path' },
                          state: { type: 'string', description: 'Workflow state (active/deleted)' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Workflows saved successfully' },
            '400': { description: 'Bad request - Invalid workflow data' },
            '401': { description: 'Unauthorized - Authentication required' },
            '404': { description: 'Repository not found' },
            '500': { description: 'Internal server error' }
          }
        },
        delete: {
          summary: 'Delete all workflows for a repository',
          description: 'Deletes all workflows for a repository from the database',
          tags: ['Workflows'],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, description: 'Repository slug identifier' }
          ],
          responses: {
            '200': { description: 'Workflows deleted successfully' },
            '400': { description: 'Bad request - Invalid slug format' },
            '401': { description: 'Unauthorized - Authentication required' },
            '404': { description: 'Repository not found' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/workflow/{slug}/exists': {
        get: {
          summary: 'Check if workflows exist',
          description: 'Checks if workflows exist in database for a repository without triggering GitHub API fetch',
          tags: ['Workflows'],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, description: 'Repository slug identifier' }
          ],
          responses: {
            '200': { description: 'Successfully checked workflow existence' },
            '400': { description: 'Bad request - Invalid slug format' },
            '401': { description: 'Unauthorized - Authentication required' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/workflow/{slug}/overview': {
        get: {
          summary: 'Get workflow overview metrics',
          description: 'Get aggregated daily metrics for workflows in a repository, including hourly breakdown and statistics',
          tags: ['Workflows'],
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, description: 'Repository slug identifier' },
            { name: 'date', in: 'query', required: false, schema: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }, description: 'Date in YYYY-MM-DD format (defaults to today)' }
          ],
          responses: {
            '200': { description: 'Successfully retrieved overview metrics' },
            '400': { description: 'Bad request - Invalid slug or date format' },
            '401': { description: 'Unauthorized - Authentication required' },
            '404': { description: 'Repository not found in dashboard' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/admin/users': {
        get: {
          summary: 'Get all users (admin only)',
          description: 'Returns all users in the system. Requires admin API token authentication.',
          tags: ['Admin'],
          security: [{ adminTokenAuth: [] }],
          parameters: [
            { name: 'includeStats', in: 'query', required: false, schema: { type: 'boolean' }, description: 'Include user statistics (repository count, workflow count, last activity)' },
            { name: 'userId', in: 'query', required: false, schema: { type: 'string' }, description: 'Get specific user by ID' }
          ],
          responses: {
            '200': { description: 'Successfully retrieved users' },
            '401': { description: 'Unauthorized - Admin token required' },
            '404': { description: 'User not found (when userId is provided)' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/admin/user-ids': {
        get: {
          summary: 'Get all user IDs (admin only)',
          description: 'Returns all user IDs in the system. Requires authentication.',
          tags: ['Admin'],
          security: [{ cookieAuth: [] }],
          responses: {
            '200': { description: 'Successfully retrieved user IDs' },
            '401': { description: 'Unauthorized - Authentication required' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/github-status': {
        get: {
          summary: 'Get GitHub Actions status',
          description: 'Fetches GitHub Actions status from GitHub Status API and returns simplified status information',
          tags: ['Status'],
          responses: {
            '200': { description: 'Successfully retrieved GitHub Actions status' },
            '500': { description: 'Internal server error (fallback response still returns 200)' }
          }
        }
      },
      '/api/health': {
        get: {
          summary: 'Health check endpoint',
          description: 'Returns server health status, uptime, and version information. No authentication required.',
          tags: ['Status'],
          responses: {
            '200': { description: 'Server is healthy' },
            '500': { description: 'Server is unhealthy' }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'better-auth.session_token',
          description: 'Session cookie authentication'
        },
        adminTokenAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Admin-Token',
          description: 'Admin API token authentication'
        }
      }
    }
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  });
}

