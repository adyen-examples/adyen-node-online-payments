#!/bin/bash

# Adyen Node.js Online Payments - Codespaces Setup Script
# This script replicates the build logic from .gitpod.yml

set -euo pipefail

echo "🚀 Setting up Adyen Node.js Online Payments development environment..."

# Function to install dependencies for a specific example
install_example() {
    local example_name=$1
    
    echo "📦 Installing dependencies for $example_name..."
    
    case "$example_name" in
        "checkout-example")
            cd checkout-example && npm install
            ;;
        "checkout-example-advanced")
            cd checkout-example-advanced && npm install
            ;;
        "authorisation-adjustment-example")
            cd authorisation-adjustment-example && npm install
            ;;
        "giftcard-example")
            cd giftcard-example && npm install
            ;;
        "paybylink-example")
            cd paybylink-example && npm install
            ;;
        "subscription-example")
            cd subscription-example && npm install
            ;;
        "in-person-payments-example")
            cd in-person-payments-example && npm install
            ;;
        "giving-example")
            cd giving-example && npm install
            ;;
        "3ds2-example")
            cd 3ds2-example/frontend && npm install
            cd ../backend && npm install
            cd .. && npm install
            ;;
        *)
            echo "⚠️  Unknown example: $example_name, skipping..."
            return 1
            ;;
    esac
    
    echo "✅ $example_name dependencies installed"
}

# Check if we're in a specific example directory or root
if [ -f "package.json" ] && [ ! -f "../package.json" ]; then
    # We're in a specific example directory
    current_dir=$(basename "$PWD")
    echo "🔍 Detected example directory: $current_dir"
    
    case "$current_dir" in
        "checkout-example"|"checkout-example-advanced"|"authorisation-adjustment-example"|"giftcard-example"|"paybylink-example"|"subscription-example"|"in-person-payments-example"|"giving-example"|"3ds2-example")
            install_example "$current_dir"
            ;;
        *)
            echo "⚠️  Unknown example directory: $current_dir"
            echo "📦 Running default npm install..."
            npm install
            ;;
    esac
else
    # We're in the root directory, install all examples
    echo "🔍 Installing dependencies for all examples..."
    
    # Array of examples to install
    examples=(
        "checkout-example"
        "checkout-example-advanced" 
        "authorisation-adjustment-example"
        "giftcard-example"
        "paybylink-example"
        "subscription-example"
        "in-person-payments-example"
        "giving-example"
    )
    
    for example in "${examples[@]}"; do
        if [ -d "$example" ]; then
            install_example "$example"
        else
            echo "⚠️  Directory $example not found, skipping..."
        fi
    done
fi

echo ""
echo "🔧 Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your environment variables:"
echo "   - ADYEN_API_KEY"
echo "   - ADYEN_CLIENT_KEY" 
echo "   - ADYEN_MERCHANT_ACCOUNT"
echo "   - ADYEN_HMAC_KEY"
echo ""
echo "2. Navigate to your desired example directory"
echo "3. Run 'npm run dev' to start the development server"