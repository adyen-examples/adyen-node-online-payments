#!/bin/bash

# Adyen Node.js Online Payments - Codespaces Setup Script

set -euo pipefail

echo "Setting up Adyen Node.js Online Payments..."

# Get the repository root directory
SCRIPT_DIRECTORY_ABSOLUTE_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT_ABSOLUTE_PATH="$(cd "${SCRIPT_DIRECTORY_ABSOLUTE_PATH}/.." && pwd)"

# Get the current working directory (workspace folder)
CURRENT_DIRECTORY_ABSOLUTE_PATH="$(pwd)"
CURRENT_DIR_NAME="$(basename "${CURRENT_DIRECTORY_ABSOLUTE_PATH}")"

    # We're at the repository root - install all examples
            echo "Installing dependencies for all examples..."
            cd "${REPO_ROOT_ABSOLUTE_PATH}"    
    for dir in */; do
        if [ -f "${dir}package.json" ]; then
            echo "Installing dependencies for ${dir%/}..."
            
            cd "${REPO_ROOT_ABSOLUTE_PATH}/${dir}" && npm install
            
            # Return to repo root after each install
            cd "${REPO_ROOT_ABSOLUTE_PATH}"
        fi
    done

echo ""
echo "Setup complete!"
echo ""
echo "Before running the server, set the following environment variables by exporting them in the terminal:"
echo "   - ADYEN_API_KEY          (https://docs.adyen.com/user-management/how-to-get-the-api-key)"
echo "   - ADYEN_CLIENT_KEY       (https://docs.adyen.com/user-management/client-side-authentication)"
echo "   - ADYEN_MERCHANT_ACCOUNT (https://docs.adyen.com/account/account-structure)"
echo "Optional variable:"
echo "   - ADYEN_HMAC_KEY         (https://docs.adyen.com/development-resources/webhooks/verify-hmac-signatures)"
echo ""
echo "Then navigate to your desired example directory and run: npm run dev"