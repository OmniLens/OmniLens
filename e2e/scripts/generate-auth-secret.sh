#!/bin/bash

# Script to generate GitHub Actions secret for pre-authenticated state
# Usage: ./e2e/scripts/generate-auth-secret.sh

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$E2E_DIR/.env"

# Load PLAYWRIGHT_BASE_URL from .env file if it exists, otherwise use environment variable or default
if [ -f "$ENV_FILE" ]; then
    # Use node to load dotenv and get PLAYWRIGHT_BASE_URL (matching how playwright.config.ts does it)
    BASE_URL=$(node -e "
        const { config } = require('dotenv');
        const path = require('path');
        config({ path: '$ENV_FILE' });
        console.log(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000');
    ")
else
    BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"
fi

echo "Using base URL: $BASE_URL"

# Calculate auth state path (matching the logic in auth.ts: new URL(baseURL).hostname.replace(/\./g, '-'))
# Use node to extract hostname exactly as auth.ts does
HOSTNAME=$(node -e "console.log(new URL('$BASE_URL').hostname.replace(/\./g, '-'))")
AUTH_FILE="playwright/.auth/user-${HOSTNAME}.json"

echo ""
echo "Step 1: Run the auth setup test locally with --headed flag:"
echo "  bun run test:e2e:auth-setup"
echo ""
echo "Step 2: Complete device verification when prompted in the browser"
echo ""
echo "Step 3: Once authentication completes, run this script again to generate the secret:"
echo "  ./e2e/scripts/generate-auth-secret.sh"
echo ""

if [ ! -f "$AUTH_FILE" ]; then
    echo "❌ Auth state file not found: $AUTH_FILE"
    echo ""
    echo "Please run the auth setup test first (see instructions above)"
    exit 1
fi

echo "✅ Found auth state file: $AUTH_FILE"
echo ""
echo "Base64 encoded auth state (copy this to GitHub Actions secret PLAYWRIGHT_AUTH_STATE):"
echo "---"
base64 -i "$AUTH_FILE"
echo "---"
echo ""
echo "To add this secret:"
echo "1. Go to your GitHub repository"
echo "2. Settings > Secrets and variables > Actions"
echo "3. New repository secret"
echo "4. Name: PLAYWRIGHT_AUTH_STATE"
echo "5. Value: (paste the base64 string above)"
echo ""
