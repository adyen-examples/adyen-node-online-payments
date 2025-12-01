#!/bin/bash

# Adyen Node.js Online Payments - Codespaces Setup Script

set -euo pipefail

echo "Setting up Adyen Node.js Online Payments..."

# Get the repository root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Get the current working directory (workspace folder)
CURRENT_DIR="$(pwd)"
CURRENT_DIR_NAME="$(basename "${CURRENT_DIR}")"

# Check if we're in an example directory (has package.json and is not root)
if [ -f "package.json" ] && [ "${CURRENT_DIR}" != "${REPO_ROOT}" ]; then
    # We're in a specific example directory - install only this example
    echo "Installing dependencies for ${CURRENT_DIR_NAME}..."
    
    # 3ds2-example has a special structure with frontend and backend
    if [ "${CURRENT_DIR_NAME}" = "3ds2-example" ]; then
        cd "${CURRENT_DIR}/frontend" && npm install
        cd "${CURRENT_DIR}/backend" && npm install
        cd "${CURRENT_DIR}" && npm install
    else
        cd "${CURRENT_DIR}" && npm install
    fi
else
    # We're at the repository root - install all examples
    echo "Installing dependencies for all examples..."
    cd "${REPO_ROOT}"
    
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
fi

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
