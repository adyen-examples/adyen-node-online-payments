#!/bin/bash

# Adyen Node.js Online Payments - Codespaces Setup Script

set -euo pipefail

echo "Setting up Adyen Node.js Online Payments..."

# Get the repository root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Change to repository root
cd "${REPO_ROOT}"

# Install dependencies
echo "Installing dependencies..."

# Auto-discover and install dependencies for all example directories
for dir in */; do
    if [ -f "${dir}package.json" ]; then
        echo "Installing dependencies for ${dir%/}..."
        
        # 3ds2-example has a special structure with frontend and backend
        if [ "${dir%/}" = "3ds2-example" ]; then
            cd "${REPO_ROOT}/${dir}frontend" && npm install
            cd "${REPO_ROOT}/${dir}backend" && npm install
            cd "${REPO_ROOT}/${dir}" && npm install
        else
            cd "${REPO_ROOT}/${dir}" && npm install
        fi
        
        # Return to repo root after each install
        cd "${REPO_ROOT}"
    fi
done

echo ""
echo "Setup complete!"
echo ""
echo "Before running the server, set the following environment variables by exporting them in the terminal:"
echo "   - ADYEN_API_KEY          (https://docs.adyen.com/user-management/how-to-get-the-api-key)"
echo "   - ADYEN_CLIENT_KEY       (https://docs.adyen.com/user-management/client-side-authentication)"
echo "   - ADYEN_MERCHANT_ACCOUNT (https://docs.adyen.com/account/account-structure)"
echo "   - ADYEN_HMAC_KEY         (https://docs.adyen.com/development-resources/webhooks/verify-hmac-signatures)"
echo ""
echo "Then navigate to your desired example directory and run: npm run dev"
