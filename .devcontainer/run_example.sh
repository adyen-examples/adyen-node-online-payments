#!/bin/bash

# Adyen Node.js Online Payments - Example Runner Script
# This script validates environment variables and runs the specified example

set -euo pipefail

# Check for required secrets
if [ -z "${ADYEN_API_KEY}" ] || [ -z "${ADYEN_MERCHANT_ACCOUNT}" ] || [ -z "${ADYEN_CLIENT_KEY}" ] || [ -z "${ADYEN_HMAC_KEY}" ]; then
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "!!! ERROR: Required Adyen secrets are not set in your Codespaces secrets.  !!!"
  echo "!!!                                                                        !!!"
  echo "!!! Please go to your repository settings > Secrets and variables >        !!!"
  echo "!!! Codespaces, and add the required secrets:                              !!!"
  echo "!!!                                                                        !!!"
  echo "!!!   - ADYEN_API_KEY: Your Adyen API Key                                 !!!"
  echo "!!!   - ADYEN_CLIENT_KEY: Your Adyen Client Key                           !!!"
  echo "!!!   - ADYEN_MERCHANT_ACCOUNT: Your Adyen Merchant Account               !!!"
  echo "!!!   - ADYEN_HMAC_KEY: Your Adyen HMAC Key for webhook validation        !!!"
  echo "!!!                                                                        !!!"
  echo "!!! After adding the secrets, you will need to rebuild the container.      !!!"
  echo "!!!                                                                        !!!"
  echo "!!! For detailed setup instructions, see codespaces-instructions.md        !!!"
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  exit 1
fi

# Default to checkout-example if not set
EXAMPLE_DIR=${1:-checkout-example}

# Validate example name against whitelist
VALID_EXAMPLES=(
    "checkout-example"
    "checkout-example-advanced"
    "3ds2-example"
    "authorisation-adjustment-example"
    "in-person-payments-example"
    "giftcard-example"
    "paybylink-example"
    "subscription-example"
    "giving-example"
)

if [[ ! " ${VALID_EXAMPLES[@]} " =~ " ${EXAMPLE_DIR} " ]]; then
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo "!!! ERROR: Invalid example name: ${EXAMPLE_DIR}                              !!!"
    echo "!!!                                                                        !!!"
    echo "!!! Valid examples are:                                                    !!!"
    printf "!!!   %-50s !!!\n" "${VALID_EXAMPLES[@]}"
    echo "!!!                                                                        !!!"
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    exit 1
fi

echo "---"
echo "🚀 Starting Adyen Node.js example: ${EXAMPLE_DIR}"
echo "---"

# Function to run different examples based on their structure
run_example() {
    local example_name=$1
    
    case "$example_name" in
        "3ds2-example")
            echo "📦 Starting 3DS2 example (fullstack)..."
            cd 3ds2-example
            npm run fullstack
            ;;
        *)
            echo "📦 Starting ${example_name}..."
            cd "${example_name}"
            npm run dev
            ;;
    esac
}

# Navigate to the example directory and run the application
run_example "${EXAMPLE_DIR}"
