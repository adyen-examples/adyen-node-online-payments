# Development Container Configuration

This directory contains the configuration for GitHub Codespaces development environment.

## Files

- `devcontainer.json` - Main configuration file for the development container
- `setup.sh` - Post-creation script that installs dependencies for all examples
- `README.md` - This file

## Features

- **Node.js 20** - Latest LTS version with npm
- **VS Code Extensions**:
  - Prettier (code formatting)
  - ESLint (code linting)
  - JSON support
  - Tailwind CSS support
  - TypeScript support
- **Port Forwarding**: 8080 (Application) and 3000 (Frontend)
- **Git & GitHub CLI** - Pre-installed for version control

## Environment Variables

The following environment variables need to be set in your Codespace:

- `ADYEN_API_KEY` - Your Adyen API key
- `ADYEN_CLIENT_KEY` - Your Adyen client key  
- `ADYEN_MERCHANT_ACCOUNT` - Your Adyen merchant account
- `ADYEN_HMAC_KEY` - Your Adyen HMAC key for webhook validation

## Usage

1. Open this repository in GitHub Codespaces
2. The setup script will automatically install dependencies for all examples
3. Navigate to your desired example directory
4. Run `npm run dev` to start the development server

## Examples

This repository includes multiple payment integration examples:

- `checkout-example` - Basic checkout flow
- `checkout-example-advanced` - Advanced 3-step checkout flow
- `3ds2-example` - 3D Secure 2 authentication
- `authorisation-adjustment-example` - Payment adjustments
- `in-person-payments-example` - POS terminal payments
- `giftcard-example` - Gift card payments
- `paybylink-example` - Pay by link flow
- `subscription-example` - Subscription payments
- `giving-example` - Donation flow

Each example can be run independently by navigating to its directory and running `npm run dev`.
