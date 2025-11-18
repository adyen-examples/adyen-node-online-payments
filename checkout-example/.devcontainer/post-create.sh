#!/bin/bash
npm install

# Check for required environment variables in Codespaces
if [ "$CODESPACES" = "true" ]; then
  if [ -z "$ADYEN_API_KEY" ] || [ -z "$ADYEN_MERCHANT_ACCOUNT" ] || [ -z "$ADYEN_CLIENT_KEY" ]; then
    echo "Error: Required Adyen secrets (ADYEN_API_KEY, ADYEN_MERCHANT_ACCOUNT, ADYEN_CLIENT_KEY) are not set in your Codespaces repository secrets."
    echo "Please set them to run the application."
    exit 1
  fi
fi

echo "Welcome to the Adyen Checkout Example!"
echo "To run the application, use the command 'npm run dev'"
echo "Your application will be available at http://localhost:8080"
