/**
 * Client-side error handling utilities
 * Provides consistent error handling across all payment methods
 */

/**
 * Custom error classes for client-side errors
 */
class ClientPaymentError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'ClientPaymentError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class NetworkError extends ClientPaymentError {
  constructor(message, statusCode) {
    super(message, 'NETWORK_ERROR', { statusCode });
    this.name = 'NetworkError';
  }
}

class ValidationError extends ClientPaymentError {
  constructor(message, field) {
    super(message, 'VALIDATION_ERROR', { field });
    this.name = 'ValidationError';
  }
}

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES = {
  'VALIDATION_ERROR': 'Please check your payment details and try again.',
  'NETWORK_ERROR': 'Network error. Please check your connection and try again.',
  'SESSION_ERROR': 'Your session has expired. Please refresh the page.',
  'PAYMENT_ERROR': 'Payment processing failed. Please try again.',
  'ADYEN_ERROR': 'Payment service is temporarily unavailable. Please try again.',
  'DEFAULT': 'An unexpected error occurred. Please try again.'
};

/**
 * Centralized error handler for client-side errors
 */
class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 50; // Keep last 50 errors
  }

  /**
   * Handle and log errors consistently
   */
  handleError(error, context = '') {
    // Log error details
    const errorDetails = {
      message: error.message,
      code: error.code || 'UNKNOWN',
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Add to error log
    this.errorLog.push(errorDetails);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift(); // Remove oldest error
    }

    // Console logging
    console.error('Payment Error:', errorDetails);

    // Return user-friendly error
    return this.getUserFriendlyError(error);
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyError(error) {
    const code = error.code || 'DEFAULT';
    const message = ERROR_MESSAGES[code] || ERROR_MESSAGES['DEFAULT'];
    
    return {
      message,
      code,
      canRetry: this.canRetry(error),
      originalError: window.location.hostname === 'localhost' ? error.message : undefined
    };
  }

  /**
   * Determine if an error can be retried
   */
  canRetry(error) {
    const retryableCodes = ['NETWORK_ERROR', 'ADYEN_ERROR'];
    return retryableCodes.includes(error.code);
  }

  /**
   * Show error notification to user
   */
  showErrorNotification(error, options = {}) {
    const errorInfo = this.getUserFriendlyError(error);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
      <div class="error-content">
        <div class="error-icon">!</div>
        <div class="error-message">${errorInfo.message}</div>
        ${errorInfo.canRetry ? '<button class="retry-button">Try Again</button>' : ''}
        <button class="close-button">×</button>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fee2e2;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;

    // Add to DOM
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);

    // Handle retry button
    const retryButton = notification.querySelector('.retry-button');
    if (retryButton && options.onRetry) {
      retryButton.addEventListener('click', () => {
        options.onRetry();
        notification.remove();
      });
    }

    // Handle close button
    const closeButton = notification.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        notification.remove();
      });
    }
  }

  /**
   * Handle payment completion with proper error handling
   */
  handlePaymentCompleted(result, component) {
    try {
      console.info('Payment completed:', result);
      
      if (!result || !result.resultCode) {
        throw new ClientPaymentError('Invalid payment result', 'PAYMENT_ERROR');
      }

      const routes = {
        'Authorised': '/result/success',
        'Pending': '/result/pending',
        'Received': '/result/pending',
        'Refused': '/result/failed',
        'Cancelled': '/result/failed',
        'Error': '/result/error'
      };

      const route = routes[result.resultCode];
      if (!route) {
        throw new ClientPaymentError(`Unknown result code: ${result.resultCode}`, 'PAYMENT_ERROR');
      }

      // Redirect to result page
      window.location.href = route;
    } catch (error) {
      this.handleError(error, 'payment-completed');
      window.location.href = '/result/error';
    }
  }

  /**
   * Handle payment failure with proper error handling
   */
  handlePaymentFailed(result, component) {
    try {
      console.error('Payment failed:', result);
      
      // Log the failure reason
      const failureReason = result?.refusalReason || result?.resultCode || 'Unknown';
      console.error('Payment failure reason:', failureReason);
      
      // Redirect to failed page
      window.location.href = '/result/failed';
    } catch (error) {
      this.handleError(error, 'payment-failed');
      window.location.href = '/result/error';
    }
  }

  /**
   * Handle general errors with proper error handling
   */
  handleGeneralError(error, component) {
    try {
      console.error('General error:', error);
      
      // Create appropriate error object
      let clientError;
      if (error.name === 'NetworkError') {
        clientError = new NetworkError(error.message, error.status);
      } else if (error.name === 'ValidationError') {
        clientError = new ValidationError(error.message, error.field);
      } else {
        clientError = new ClientPaymentError(
          error.message || 'An unexpected error occurred',
          'ADYEN_ERROR'
        );
      }

      this.handleError(clientError, 'general-error');
      window.location.href = '/result/error';
    } catch (handlingError) {
      console.error('Error in error handler:', handlingError);
      window.location.href = '/result/error';
    }
  }

  /**
   * Get error log for debugging
   */
  getErrorLog() {
    return this.errorLog;
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }
}

// Create global error handler instance
const errorHandler = new ErrorHandler();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorHandler, ClientPaymentError, NetworkError, ValidationError, errorHandler };
} else {
  // Browser environment
  window.ErrorHandler = ErrorHandler;
  window.ClientPaymentError = ClientPaymentError;
  window.NetworkError = NetworkError;
  window.ValidationError = ValidationError;
  window.errorHandler = errorHandler;
}
