/**
 * Adyen API Service
 * Handles all Adyen API interactions with proper error handling
 */

const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
const { hmacValidator } = require('@adyen/api-library');
const { config, getCurrencyForCountry, getLineItemsForPaymentMethod } = require('../config');
const { ConfigurationError, retryRequest, handleAdyenError } = require('../utils/errorHandler');

// Adyen NodeJS library configuration
const adyenConfig = new Config();
adyenConfig.apiKey = config.adyen.apiKey;

if (!adyenConfig.apiKey) {
  throw new ConfigurationError('ADYEN_API_KEY is required', ['ADYEN_API_KEY']);
}

const client = new Client({ config: adyenConfig });
client.setEnvironment(config.adyen.environment);
const checkout = new CheckoutAPI(client);

/**
 * Get payment methods
 */
const getPaymentMethods = async (countryCode, amount, shopperLocale) => {
  try {
    const response = await retryRequest(async () => {
      return await checkout.PaymentMethodsApi.paymentMethods({
        channel: "Web",
        merchantAccount: config.adyen.merchantAccount,
        countryCode,
        amount,
        shopperLocale,
      });
    });
    return response;
  } catch (error) {
    throw handleAdyenError(error);
  }
};

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

    // MobilePay-specific configuration (only for Denmark)
    if (paymentMethod === 'mobilepay' || selectedCountry === 'DK') {
      currency = "DKK";
      countryCode = "DK";
      lineItems = config.lineItems.mobilepay;
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


module.exports = {
  getPaymentMethods,
  createSession,
  submitPaymentDetails,
  hmacValidator: new hmacValidator(),
  adyenConfig: config.adyen // Export Adyen specific config
};
