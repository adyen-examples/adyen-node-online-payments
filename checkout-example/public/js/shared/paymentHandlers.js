/**
 * Shared Payment Handlers
 * Centralized payment event handling for all payment methods
 */

/**
 * Handle payment completion
 */
function handleOnPaymentCompleted(resultCode) {
  console.info('Payment completed:', resultCode);
  
  const routes = {
    'Authorised': '/result/success',
    'Pending': '/result/pending',
    'Received': '/result/pending',
    'Refused': '/result/failed',
    'Cancelled': '/result/failed',
    'Error': '/result/error'
  };

  const route = routes[resultCode];
  if (!route) {
    console.error(`Unknown result code: ${resultCode}`);
    window.location.href = '/result/error';
    return;
  }

  window.location.href = route;
}

/**
 * Handle payment failure
 */
function handleOnPaymentFailed(resultCode) {
  console.error('Payment failed:', resultCode);
  window.location.href = '/result/failed';
}

/**
 * Handle general errors
 */
function handleOnError(error, component) {
  console.error('Payment error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    component: component
  });
  window.location.href = '/result/error';
}

/**
 * Create standardized payment configuration
 */
function createPaymentConfiguration(session, options = {}) {
  const {
    clientKey,
    environment = 'test',
    amount = { value: 10000, currency: 'EUR' },
    locale = 'en_US',
    countryCode = 'NL',
    showPayButton = true,
    translations = {}
  } = options;

  return {
    session: session,
    clientKey,
    environment,
    amount,
    locale,
    countryCode,
    showPayButton,
    translations,
    onPaymentCompleted: (result, component) => {
      if (window.errorHandler) {
        window.errorHandler.handlePaymentCompleted(result, component);
      } else {
        console.info("onPaymentCompleted", result, component);
        handleOnPaymentCompleted(result.resultCode);
      }
    },
    onPaymentFailed: (result, component) => {
      if (window.errorHandler) {
        window.errorHandler.handlePaymentFailed(result, component);
      } else {
        console.info("onPaymentFailed", result, component);
        handleOnPaymentFailed(result.resultCode);
      }
    },
    onError: (error, component) => {
      if (window.errorHandler) {
        window.errorHandler.handleGeneralError(error, component);
      } else {
        console.error("onError", error.name, error.message, error.stack, component);
        handleOnError(error, component);
      }
    }
  };
}

/**
 * Create payment method configuration
 */
function createPaymentMethodConfiguration(type, options = {}) {
  const baseConfig = {
    card: {
      showBrandIcon: true,
      hasHolderName: true,
      holderNameRequired: true,
      billingAddressRequired: false
    },
    ideal: {
      showImage: true
    },
    vipps: {
      showImage: true
    },
    klarna: {
      showImage: true
    },
    sepa: {
      showImage: true
    },
    googlepay: {
      showImage: true
    }
  };

  return {
    [type]: {
      ...baseConfig[type],
      ...options
    }
  };
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleOnPaymentCompleted,
    handleOnPaymentFailed,
    handleOnError,
    createPaymentConfiguration,
    createPaymentMethodConfiguration
  };
} else {
  // Browser environment
  window.PaymentHandlers = {
    handleOnPaymentCompleted,
    handleOnPaymentFailed,
    handleOnError,
    createPaymentConfiguration,
    createPaymentMethodConfiguration
  };
}
