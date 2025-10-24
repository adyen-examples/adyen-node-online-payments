/**
 * Payments Controller
 * Handles payment-related API endpoints
 */

const { asyncHandler } = require('../utils/errorHandler');
const { getBaseUrl } = require('../config');
const adyenService = require('../services/adyenService');
const paymentService = require('../services/paymentService');

/**
 * Create a payment session
 */
const createSession = asyncHandler(async (req, res) => {
  try {
    // Generate unique order reference
    const orderRef = paymentService.generateOrderRef();
    
    // Get base URL for redirects
    const baseUrl = getBaseUrl(req);
    
    // Get payment method type and country from query parameters
    const paymentMethod = req.query.type || 'default';
    let selectedCountry = req.query.country || 'NL';
    
    console.log('Session creation request:', {
      orderRef,
      paymentMethod,
      selectedCountry,
      baseUrl
    });
    
    // Ensure we have just the country code, not an object
    if (typeof selectedCountry === 'string' && selectedCountry.startsWith('{')) {
      try {
        const parsed = JSON.parse(selectedCountry);
        selectedCountry = parsed.id || 'NL';
      } catch (e) {
        console.warn('Failed to parse country parameter, using default');
        selectedCountry = 'NL';
      }
    }
    
    const sessionData = {
      orderRef,
      baseUrl,
      paymentMethod,
      selectedCountry,
      countryCode: selectedCountry
    };
    
    const response = await adyenService.createSession(sessionData);
    
    console.log('Session created with returnUrl:', `${baseUrl}/handleShopperRedirect?orderRef=${orderRef}`);
    res.json(response);
  } catch (error) {
    console.error('Session creation error:', {
      message: error.message,
      errorCode: error.errorCode,
      statusCode: error.statusCode,
      query: req.query
    });
    throw error;
  }
});

/**
 * Handle shopper redirect
 */
const handleShopperRedirect = asyncHandler(async (req, res) => {
  console.log('=== REDIRECT RECEIVED ===');
  console.log('Method:', req.method);
  console.log('Query params:', Object.keys(req.query));
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('Headers keys:', Object.keys(req.headers));
  
  try {
    // Create the payload for submitting payment details
    const redirect = req.method === "GET" ? req.query : req.body;
    const details = {};
    
    if (redirect.redirectResult) {
      details.redirectResult = redirect.redirectResult;
    } else if (redirect.payload) {
      details.payload = redirect.payload;
    } else {
      throw new Error('Missing payment details');
    }
    
    console.log('Redirect details:', details);

    // Validate order reference
    const orderRef = redirect.orderRef;
    if (!orderRef) {
      throw new Error('Missing order reference');
    }

    // Submit payment details to Adyen
    const response = await adyenService.submitPaymentDetails(details);

    // Store the result code for status tracking
    if (response.resultCode) {
      paymentService.storePaymentStatus(orderRef, response.resultCode);
      console.log(`Payment status stored for ${orderRef}: ${response.resultCode}`);
    }

    // Redirect based on result code
    switch (response.resultCode) {
      case "Authorised":
        res.redirect(`/result/success?orderRef=${orderRef}`);
        break;
      case "Pending":
      case "Received":
        res.redirect(`/result/pending?orderRef=${orderRef}`);
        break;
      case "Refused":
        res.redirect(`/result/failed?orderRef=${orderRef}`);
        break;
      case "Cancelled":
        res.redirect(`/result/failed?orderRef=${orderRef}`);
        break;
      default:
        console.warn(`Unknown result code: ${response.resultCode}`);
        res.redirect(`/result/error?orderRef=${orderRef}`);
        break;
    }
  } catch (error) {
    console.error('Redirect handling error:', {
      message: error.message,
      errorCode: error.errorCode,
      statusCode: error.statusCode,
      redirectData: req.method === "GET" ? req.query : req.body
    });
    throw error;
  }
});

/**
 * Get payment status
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
  const { orderRef } = req.params;
  
  if (!orderRef) {
    return res.status(400).json({
      error: 'Order reference is required',
      code: 'MISSING_ORDER_REF'
    });
  }
  
  const status = paymentService.getPaymentStatus(orderRef);
  
  if (!status) {
    return res.status(404).json({
      error: 'Payment not found',
      code: 'PAYMENT_NOT_FOUND',
      orderRef
    });
  }
  
  res.json(status);
});

/**
 * Debug endpoint to get all payment statuses
 */
const getAllPaymentStatuses = asyncHandler(async (req, res) => {
  const statuses = paymentService.getAllPaymentStatuses();
  res.json({
    count: Object.keys(statuses).length,
    statuses
  });
});

module.exports = {
  createSession,
  handleShopperRedirect,
  getPaymentStatus,
  getAllPaymentStatuses
};
