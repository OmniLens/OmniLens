# E2E Authentication Setup Guide

## Problem

GitHub requires device verification when logging in from a new device/IP address. In CI environments, you can't interact with headless browsers to complete this verification manually.

## Solution

Pre-authenticate locally **once**, then store the authenticated session as a GitHub Actions secret. CI will use this pre-authenticated session, bypassing device verification.

## Setup Steps

### 1. Run Authentication Locally

Run the auth setup test locally with a headed browser:

```bash
bun run test:e2e:auth-setup
```

**Important**: 
- The test uses `PLAYWRIGHT_BASE_URL` from your `e2e/.env` file
- Make sure it's set to the **same base URL** that CI uses (set in `PLAYWRIGHT_BASE_URL` secret)
- If you need to override it, you can: `PLAYWRIGHT_BASE_URL=https://your-production-url.com bun run test:e2e:auth-setup`

### 2. Complete Device Verification

When the browser opens:
1. The test will navigate to GitHub login
2. You'll see the device verification page
3. Complete verification manually (email code, mobile app, etc.)
4. The test will wait up to 5 minutes for you to complete it
5. Once verified, the auth state is saved to `playwright/.auth/user-{hostname}.json`

### 3. Generate GitHub Secret

Run the helper script to generate the base64-encoded secret:

```bash
./e2e/scripts/generate-auth-secret.sh
```

The script automatically uses `PLAYWRIGHT_BASE_URL` from your `e2e/.env` file. This will output a base64 string. Copy it.

### 4. Add GitHub Actions Secret

1. Go to your GitHub repository
2. **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `PLAYWRIGHT_AUTH_STATE`
5. Value: Paste the base64 string from step 3
6. Click **Add secret**

### 5. CI Will Use Pre-Authenticated State

On the next CI run:
- ✅ Auth state is restored from the secret
- ✅ Tests run with pre-authenticated session
- ✅ No device verification needed
- ✅ Cache is updated for future runs

## How It Works

1. **First time**: You authenticate locally, generating the auth state file
2. **Secret storage**: The auth state (cookies + localStorage) is base64-encoded and stored as a GitHub secret
3. **CI restoration**: CI decodes the secret and writes it to `playwright/.auth/`
4. **Test execution**: Tests load the pre-authenticated state, skipping login
5. **Cache fallback**: If secret is missing, CI falls back to cache, then authentication

## Updating the Auth State

If the auth state expires or becomes invalid:

1. Repeat steps 1-4 above
2. Update the `PLAYWRIGHT_AUTH_STATE` secret with the new base64 string
3. CI will use the updated state on the next run

## Troubleshooting

### "No auth state secret found"
- Make sure you've added the `PLAYWRIGHT_AUTH_STATE` secret
- Verify the secret name is exactly `PLAYWRIGHT_AUTH_STATE`

### "Auth state file not found"
- Run the auth setup test locally first
- Make sure you're using the same `PLAYWRIGHT_BASE_URL` as CI

### "Device verification timeout"
- The test waits 5 minutes for manual verification
- Make sure you complete verification within that time
- If running locally, use `--headed` flag to see the browser
