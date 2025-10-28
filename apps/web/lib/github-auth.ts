import { auth } from './auth';

/**
 * Get the user's GitHub access token from Better Auth
 * @param userId - The user's ID from the session
 * @returns The GitHub access token or null if not found
 */
export async function getUserGitHubToken(userId: string): Promise<string | null> {
  try {
    // Get the GitHub access token using Better Auth API
    const token = await auth.api.getAccessToken({
      body: { 
        userId,
        providerId: 'github'
      }
    });
    
    return token?.accessToken || null;
  } catch (error) {
    console.error('Error getting GitHub token:', error);
    return null;
  }
}

/**
 * Make an authenticated GitHub API request using the user's token
 * @param userId - The user's ID from the session
 * @param url - The GitHub API URL
 * @param options - Additional fetch options
 * @returns The GitHub API response
 */
export async function makeGitHubRequest(
  userId: string, 
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const token = await getUserGitHubToken(userId);
  
  if (!token) {
    throw new Error('GitHub access token not found. Please ensure you are logged in with GitHub.');
  }

  return fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'OmniLens-Dashboard',
      ...options.headers,
    },
  });
}
