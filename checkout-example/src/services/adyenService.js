/**
 * Adyen API Service
 * Handles all Adyen API interactions with proper error handling
 */

const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
const { config, getCurrencyForCountry, getLineItemsForPaymentMethod } = require('../config');
const { handleAdyenError, retryRequest } = require('../utils/errorHandler');

/**
 * Initialize Adyen client
 */
const initializeAdyenClient = () => {
  const adyenConfig = new Config();
  adyenConfig.apiKey = config.adyen.apiKey;
  
  const client = new Client({ config: adyenConfig });
  client.setEnvironment(config.adyen.environment);
  
  return new CheckoutAPI(client);
};

// Initialize the checkout API
const checkout = initializeAdyenClient();

/**
 * Create a payment session
 */
const createSession = async (sessionData) => {
  try {
    const {
      orderRef,
      baseUrl,
      paymentMethod = 'default',
      selectedCountry = 'NL'
    } = sessionData;

    // Get currency and line items based on payment method and country
    let currency = getCurrencyForCountry(selectedCountry);
    let lineItems = getLineItemsForPaymentMethod(paymentMethod);
    let countryCode = selectedCountry;

    // Vipps-specific configuration (only for Norway)
    if (paymentMethod === 'vipps' || selectedCountry === 'NO') {
      currency = "NOK";
      countryCode = "NO";
      lineItems = config.lineItems.vipps;
    }

    const sessionRequest = {
      amount: { currency: currency, value: config.payment.defaultAmount },
      countryCode: countryCode,
      merchantAccount: config.adyen.merchantAccount,
      reference: orderRef,
      returnUrl: `${baseUrl}/handleShopperRedirect?orderRef=${orderRef}`,
      lineItems: lineItems
    };

    console.log('Creating session with request:', {
      amount: sessionRequest.amount,
      countryCode: sessionRequest.countryCode,
      reference: sessionRequest.reference,
      returnUrl: sessionRequest.returnUrl
    });

    const response = await retryRequest(async () => {
      return await checkout.PaymentsApi.sessions(sessionRequest);
    });

    console.log('Session created successfully:', {
      sessionId: response.id,
      returnUrl: sessionRequest.returnUrl
    });

    return response;
  } catch (error) {
    console.error('Session creation failed:', {
      message: error.message,
      errorCode: error.errorCode,
      statusCode: error.statusCode,
      sessionData
    });

    throw handleAdyenError(error);
  }
};

/**
 * Submit payment details
 */
const submitPaymentDetails = async (details) => {
  try {
    console.log('Submitting payment details:', {
      hasRedirectResult: !!details.redirectResult,
      hasPayload: !!details.payload
    });

    const response = await retryRequest(async () => {
      return await checkout.PaymentsApi.paymentsDetails({ details });
    });

    console.log('Payment details submitted successfully:', {
      resultCode: response.resultCode,
      pspReference: response.pspReference
    });

    return response;
  } catch (error) {
    console.error('Payment details submission failed:', {
      message: error.message,
      errorCode: error.errorCode,
      statusCode: error.statusCode,
      details
    });

    throw handleAdyenError(error);
  }
};

/**
 * Get payment status
 */
const getPaymentStatus = async (orderRef) => {
  try {
    // In a real implementation, you would query your database
    // For now, we'll return a mock status
    const mockStatuses = ['Authorised', 'Pending', 'Refused', 'Error'];
    const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
    
    return {
      orderRef,
      status: randomStatus,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Get payment status failed:', {
      message: error.message,
      orderRef
    });

    throw error;
  }
};

module.exports = {
  createSession,
  submitPaymentDetails,
  getPaymentStatus
};
