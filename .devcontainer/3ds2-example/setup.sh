#!/bin/bash
set -euo pipefail
echo "Setting up Adyen 3ds2-example..."
# Get the repository root directory
SCRIPT_DIRECTORY_ABSOLUTE_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT_ABSOLUTE_PATH="$(cd "${SCRIPT_DIRECTORY_ABSOLUTE_PATH}/../.." && pwd)"
CURRENT_DIR_NAME="3ds2-example"
CURRENT_DIRECTORY_ABSOLUTE_PATH="${REPO_ROOT_ABSOLUTE_PATH}/${CURRENT_DIR_NAME}"
echo "Installing dependencies for ${CURRENT_DIR_NAME}..."
cd "${CURRENT_DIRECTORY_ABSOLUTE_PATH}/frontend" && npm install
cd "${CURRENT_DIRECTORY_ABSOLUTE_PATH}/backend" && npm install
cd "${CURRENT_DIRECTORY_ABSOLUTE_PATH}" && npm install
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
