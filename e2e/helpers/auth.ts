import { Page, expect, Browser } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function getGitHubCredentials() {
  const username = process.env.PLAYWRIGHT_GITHUB_USERNAME?.replace(/^["']|["']$/g, '');
  const password = process.env.PLAYWRIGHT_GITHUB_PASSWORD?.replace(/^["']|["']$/g, '');
  
  if (!username || !password) {
    throw new Error(
      'PLAYWRIGHT_GITHUB_USERNAME and PLAYWRIGHT_GITHUB_PASSWORD are required. ' +
      'Set them in e2e/.env file. For passwords with special characters, wrap in quotes.'
    );
  }
  
  return { username, password };
}

/**
 * Authenticate user via GitHub OAuth flow
 * This function handles the complete OAuth flow including:
 * - Navigating to login page
 * - Clicking GitHub OAuth button
 * - Filling GitHub credentials
 * - Handling OAuth consent screen
 * - Validating successful authentication
 * 
 * @param page - Playwright page instance
 * @param baseURL - Base URL of the application
 * @throws Error if any step of the authentication flow fails
 */
export async function authenticate(page: Page, baseURL: string): Promise<void> {
  const credentials = getGitHubCredentials();
  
  try {
    // Step 1: Navigate to login page
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Step 2: Click "Continue with GitHub" button
    const githubButton = page.getByRole('button', { name: 'Continue with GitHub' });
    await expect(githubButton).toBeVisible({ timeout: 10000 });
    await githubButton.click();
    
    // Step 3: Wait for GitHub login page
    await page.waitForURL(/github\.com\/login/, { timeout: 15000 });
    
    // Step 4: Fill GitHub credentials
    const usernameInput = page.locator('input[name="login"]');
    const passwordInput = page.locator('input[name="password"]');
    
    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    
    await usernameInput.fill(credentials.username);
    
    // Use evaluate to set password value directly to avoid exposing it in Playwright UI
    await passwordInput.evaluate((el: HTMLInputElement, value: string) => {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, credentials.password);
    
    // Step 5: Click "Sign in" button
    const signInButton = page.getByRole('button', { name: 'Sign in' }).first();
    await expect(signInButton).toBeEnabled({ timeout: 5000 });
    await signInButton.click();
    
    // Step 6: Check for 2FA prompt - FAIL if detected
    const twoFactorPrompt = page.locator('input[name="otp"], input[type="tel"][name="app_otp"]');
    const twoFactorVisible = await twoFactorPrompt.isVisible().catch(() => false);
    
    if (twoFactorVisible) {
      throw new Error(
        '2FA is required on test account. Please disable 2FA on the GitHub test account ' +
        'or configure the account to use an app-specific password.'
      );
    }
    
    // Step 7: Check for CAPTCHA - FAIL if detected
    const captchaElement = page.locator('iframe[src*="captcha"], .captcha, [data-callback*="captcha"]');
    const captchaVisible = await captchaElement.isVisible().catch(() => false);
    
    if (captchaVisible) {
      throw new Error(
        'CAPTCHA detected. Please configure the test account to avoid CAPTCHA challenges ' +
        'by whitelisting test IPs or adjusting account security settings.'
      );
    }
    
    // Step 8: Handle OAuth consent screen if present
    await page.waitForURL(/github\.com\/login\/oauth\/authorize|github\.com\/login/, { timeout: 10000 }).catch(() => {});
    
    if (page.url().includes('github.com/login/oauth/authorize')) {
      const authorizeButton = page.getByRole('button', { name: 'Authorize' });
      if (await authorizeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await authorizeButton.click();
      }
    }
    
    // Step 9: Wait for redirect to dashboard
    const dashboardURL = new RegExp(`${baseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/dashboard`);
    await page.waitForURL(dashboardURL, { timeout: 30000, waitUntil: 'networkidle' });
    
    // Step 11: Validate successful authentication
    const repositoriesHeading = page.getByRole('heading', { name: 'Repositories' }).first();
    await expect(repositoriesHeading).toBeVisible({ timeout: 15000 });
  } catch (error) {
    // Capture screenshot for debugging
    const screenshotPath = path.join(__dirname, '../../playwright/.auth/auth-error.png');
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    
    // Sanitize error message to prevent credential leakage
    if (error instanceof Error) {
      const sanitizedMessage = error.message
        .replace(/PLAYWRIGHT_GITHUB_USERNAME[=:]\s*[^\s]+/gi, 'PLAYWRIGHT_GITHUB_USERNAME=***')
        .replace(/PLAYWRIGHT_GITHUB_PASSWORD[=:]\s*[^\s]+/gi, 'PLAYWRIGHT_GITHUB_PASSWORD=***')
        .replace(/username[=:]\s*[^\s]+/gi, 'username=***')
        .replace(/password[=:]\s*[^\s]+/gi, 'password=***');
      throw new Error(`Authentication failed: ${sanitizedMessage}`);
    }
    throw error;
  }
}

/**
 * Save authenticated state to file
 * This saves cookies and localStorage for reuse in subsequent tests
 * 
 * @param page - Playwright page instance
 * @param filePath - Path to save the state file
 */
export async function saveAuthenticatedState(page: Page, filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await page.context().storageState({ path: filePath });
}

/**
 * Get environment-specific auth state path based on baseURL
 * Creates separate auth files per environment (e.g., user-localhost.json, user-prod-example-com.json)
 */
export function getAuthStatePath(baseURL: string): string {
  const url = new URL(baseURL);
  const hostname = url.hostname.replace(/\./g, '-');
  const filename = `user-${hostname}.json`;
  return path.join(__dirname, '../../playwright/.auth', filename);
}

export async function isAuthStateValid(authStatePath: string): Promise<boolean> {
  try {
    const stateContent = await fs.readFile(authStatePath, 'utf-8');
    const state = JSON.parse(stateContent);
    
    // Check if we have cookies
    if (!state.cookies || state.cookies.length === 0) {
      return false;
    }
    
    // Check if any critical authentication cookie is still valid
    const now = Date.now() / 1000; // Cookie expires are in seconds since epoch
    const validCookies = state.cookies.filter((cookie: any) => {
      // Cookie is valid if it has no expiration (session cookie) or expiration is in the future
      return !cookie.expires || cookie.expires > now;
    });
    
    // Need at least one valid cookie to consider state valid
    return validCookies.length > 0;
  } catch {
    return false;
  }
}

export async function ensureAuthenticated(
  browser: Browser,
  baseURL: string
): Promise<string> {
  const authStatePath = getAuthStatePath(baseURL);
  
  if (await isAuthStateValid(authStatePath)) {
    return authStatePath;
  }
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await authenticate(page, baseURL);
    await saveAuthenticatedState(page, authStatePath);
    return authStatePath;
  } finally {
    await context.close();
  }
}
