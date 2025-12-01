/**
 * Centralized error handling utilities for Adyen integration
 * Provides consistent error handling across server and client
 */

/**
 * Custom error classes for different types of payment errors
 * Based on Adyen's actual error structure and common error patterns
 */
class PaymentError extends Error {
  constructor(message, code, statusCode = 500, details = {}) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class ValidationError extends PaymentError {
  constructor(message, field, value) {
    super(message, 'VALIDATION_ERROR', 400, { field, value });
    this.name = 'ValidationError';
  }
}

/**
 * Adyen API Error - handles actual Adyen API errors
 * Based on Adyen's error structure: { status, errorCode, message, errorType, invalidFields }
 */
class AdyenAPIError extends PaymentError {
  constructor(message, adyenErrorCode, statusCode = 500, errorType = 'internal', invalidFields = []) {
    super(message, 'ADYEN_API_ERROR', statusCode, { 
      adyenErrorCode, 
      errorType, 
      invalidFields 
    });
    this.name = 'AdyenAPIError';
    this.adyenErrorCode = adyenErrorCode;
    this.errorType = errorType;
    this.invalidFields = invalidFields;
  }

  /**
   * Create AdyenAPIError from actual Adyen error response
   */
  static fromAdyenError(adyenError) {
    const errorCode = adyenError.errorCode || 'UNKNOWN';
    const statusCode = adyenError.status || adyenError.statusCode || 500;
    const message = adyenError.message || adyenError.detail || 'Adyen API error';
    const errorType = adyenError.errorType || 'internal';
    const invalidFields = adyenError.invalidFields || [];

    return new AdyenAPIError(message, errorCode, statusCode, errorType, invalidFields);
  }
}

class SessionError extends PaymentError {
  constructor(message, sessionId) {
    super(message, 'SESSION_ERROR', 400, { sessionId });
    this.name = 'SessionError';
  }
}

/**
 * Configuration Error - for missing or invalid configuration
 */
class ConfigurationError extends PaymentError {
  constructor(message, missingConfig = []) {
    super(message, 'CONFIGURATION_ERROR', 500, { missingConfig });
    this.name = 'ConfigurationError';
  }
}

/**
 * Authentication Error - for API key or authentication issues
 */
class AuthenticationError extends PaymentError {
  constructor(message, authType = 'api_key') {
    super(message, 'AUTHENTICATION_ERROR', 401, { authType });
    this.name = 'AuthenticationError';
  }
}

/**
 * Server-side error handler middleware
 */
const handleServerError = (error, req, res, next) => {
  console.error('Server Error:', {
    message: error.message,
    code: error.code,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (error instanceof PaymentError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      ...(isDevelopment && { details: error.details, stack: error.stack })
    });
  }

  // Handle Adyen API errors specifically
  if (error instanceof AdyenAPIError) {
    return res.status(error.statusCode || 500).json({
      error: 'Payment processing error',
      code: 'PAYMENT_ERROR',
      adyenErrorCode: error.adyenErrorCode,
      errorType: error.errorType,
      ...(isDevelopment && { 
        details: error.message,
        invalidFields: error.invalidFields 
      })
    });
  }

  // Handle authentication errors
  if (error instanceof AuthenticationError) {
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTHENTICATION_ERROR',
      ...(isDevelopment && { details: error.message })
    });
  }

  // Handle configuration errors
  if (error instanceof ConfigurationError) {
    return res.status(500).json({
      error: 'Configuration error',
      code: 'CONFIGURATION_ERROR',
      ...(isDevelopment && { 
        details: error.message,
        missingConfig: error.details.missingConfig 
      })
    });
  }

  // Generic server error
  return res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && { details: error.message })
  });
};

/**
 * Client-side error handler
 */
const handleClientError = (error, context = '') => {
  console.error('Client Error:', {
    message: error.message,
    code: error.code,
    context,
    timestamp: new Date().toISOString()
  });

  // Show user-friendly error messages
  const errorMessages = {
    'VALIDATION_ERROR': 'Please check your payment details and try again.',
    'ADYEN_API_ERROR': 'Payment processing is temporarily unavailable. Please try again.',
    'SESSION_ERROR': 'Your session has expired. Please refresh the page.',
    'NETWORK_ERROR': 'Network error. Please check your connection and try again.',
    'DEFAULT': 'An unexpected error occurred. Please try again.'
  };

  const userMessage = errorMessages[error.code] || errorMessages['DEFAULT'];
  
  // In development, show more details
  if (process.env.NODE_ENV === 'development') {
    console.error('Full error details:', error);
  }

  return {
    message: userMessage,
    code: error.code,
    canRetry: ['NETWORK_ERROR', 'ADYEN_API_ERROR'].includes(error.code)
  };
};

/**
 * Async error wrapper for Express routes
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validate required environment variables
 */
const validateEnvironment = () => {
  const requiredVars = [
    'ADYEN_API_KEY',
    'ADYEN_MERCHANT_ACCOUNT',
    'ADYEN_CLIENT_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new PaymentError(
      `Missing required environment variables: ${missing.join(', ')}`,
      'CONFIGURATION_ERROR',
      500
    );
  }
  
  // HMAC key is optional - only needed for webhook validation
  if (!process.env.ADYEN_HMAC_KEY) {
    console.log('Note: ADYEN_HMAC_KEY is not set. Webhook validation will be skipped.');
  }
};

/**
 * Safe JSON parsing with error handling
 */
const tryJsonParse = (jsonString, defaultValue = {}) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error.message);
    return defaultValue;
  }
};

/**
 * Retry mechanism for network requests
 */
const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw new PaymentError(
          `Request failed after ${maxRetries} attempts: ${error.message}`,
          'NETWORK_ERROR',
          500,
          { originalError: error.message }
        );
      }
      
      console.warn(`Request attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

/**
 * Handle Adyen API errors with proper error mapping
 * Maps Adyen's error codes to appropriate error types
 */
const handleAdyenError = (error) => {
  console.error('Adyen API Error:', {
    message: error.message,
    errorCode: error.errorCode,
    statusCode: error.status || error.statusCode,
    errorType: error.errorType,
    invalidFields: error.invalidFields
  });

  // Map common Adyen error codes to our error types
  const errorCode = error.errorCode;
  const statusCode = error.status || error.statusCode || 500;

  // Authentication errors (000, 010)
  if (errorCode === '000' || errorCode === '010') {
    return new AuthenticationError(
      error.message || 'Authentication failed',
      'api_key'
    );
  }

  // Validation errors (100-199)
  if (errorCode && errorCode.startsWith('1')) {
    return new ValidationError(
      error.message || 'Validation error',
      error.invalidFields?.[0]?.name || 'unknown',
      error.invalidFields?.[0]?.value
    );
  }

  // Configuration errors (200-299)
  if (errorCode && errorCode.startsWith('2')) {
    return new ConfigurationError(
      error.message || 'Configuration error',
      error.invalidFields?.map(field => field.name) || []
    );
  }

  // Session errors (300-399)
  if (errorCode && errorCode.startsWith('3')) {
    return new SessionError(
      error.message || 'Session error',
      error.sessionId || 'unknown'
    );
  }

  // Default to AdyenAPIError
  return AdyenAPIError.fromAdyenError(error);
};

module.exports = {
  PaymentError,
  ValidationError,
  AdyenAPIError,
  SessionError,
  ConfigurationError,
  AuthenticationError,
  handleServerError,
  handleClientError,
  asyncHandler,
  validateEnvironment,
  tryJsonParse,
  retryRequest,
  handleAdyenError
};
