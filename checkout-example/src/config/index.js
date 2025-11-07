/**
 * Configuration management for Adyen integration
 * Centralizes all configuration settings and environment variables
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config({
  path: "./.env",
});

/**
 * Application configuration
 */
const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 8080,
    baseUrl: process.env.BASE_URL,
    environment: process.env.NODE_ENV || 'development'
  },

  // Adyen configuration
  adyen: {
    ADYEN_API_KEY: process.env.ADYEN_API_KEY,
    ADYEN_MERCHANT_ACCOUNT: process.env.ADYEN_MERCHANT_ACCOUNT,
    ADYEN_CLIENT_KEY: process.env.ADYEN_CLIENT_KEY,
    ADYEN_HMAC_KEY: process.env.ADYEN_HMAC_KEY,
    ADYEN_ENVIRONMENT: process.env.NODE_ENV === 'production' ? 'LIVE' : 'TEST'
  },

  // Payment configuration
  payment: {
    defaultCurrency: 'EUR',
    defaultCountry: 'NL',
    defaultAmount: 10000, // 100 EUR in minor units
    supportedCurrencies: {
      'US': 'USD',
      'GB': 'GBP',
      'NO': 'NOK',
      'SE': 'SEK',
      'DK': 'DKK',
      'CH': 'CHF',
      'JP': 'JPY',
      'CN': 'CNY',
      'KR': 'KRW',
      'BR': 'BRL',
      'MX': 'MXN',
      'AU': 'AUD',
      'CA': 'CAD',
      'IN': 'INR',
      'SG': 'SGD',
      'HK': 'HKD',
      'MY': 'MYR',
      'TH': 'THB',
      'ID': 'IDR',
      'PH': 'PHP',
      'VN': 'VND',
      'RU': 'RUB',
      'PL': 'PLN',
      'CZ': 'CZK',
      'AE': 'AED',
      'KE': 'KES',
      'NZ': 'NZD'
    }
  },

  // Line items configuration
  lineItems: {
    default: [
      { quantity: 1, amountIncludingTax: 5000, description: "Sunglasses" },
      { quantity: 1, amountIncludingTax: 5000, description: "Headphones" }
    ],
    vipps: [
      { quantity: 1, amountIncludingTax: 5000, description: "Sunglasses" },
      { quantity: 1, amountIncludingTax: 5000, description: "Headphones" }
    ],
    mobilepay: [
      { quantity: 1, amountIncludingTax: 5000, description: "Sunglasses" },
      { quantity: 1, amountIncludingTax: 5000, description: "Headphones" }
    ]
  }
};

/**
 * Validate required configuration
 */
const validateConfig = () => {
  const requiredVars = [
    'ADYEN_API_KEY',
    'ADYEN_MERCHANT_ACCOUNT',
    'ADYEN_CLIENT_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // HMAC key is optional - only needed for webhook validation
  if (!process.env.ADYEN_HMAC_KEY) {
    console.log('Note: ADYEN_HMAC_KEY is not set. Webhook validation will be skipped.');
  }

  return true;
};

/**
 * Get currency for country
 */
const getCurrencyForCountry = (countryCode) => {
  return config.payment.supportedCurrencies[countryCode] || config.payment.defaultCurrency;
};

/**
 * Get line items for payment method
 */
const getLineItemsForPaymentMethod = (paymentMethod) => {
  if (paymentMethod === 'vipps') {
    return config.lineItems.vipps;
  }
  return config.lineItems.default;
};

/**
 * Get base URL for redirects
 */
const getBaseUrl = (req) => {
  // Check for custom base URL override
  if (config.server.baseUrl) {
    return config.server.baseUrl;
  }
  
  // Use the actual request host and protocol
  const host = req.get('host');
  const protocol = req.socket.encrypted ? 'https' : 'http';
  return `${protocol}://${host}`;
};

module.exports = {
  config,
  validateConfig,
  getCurrencyForCountry,
  getLineItemsForPaymentMethod,
  getBaseUrl
};
