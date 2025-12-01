/**
 * Payments Controller
 * Handles payment-related API endpoints
 */

const { asyncHandler } = require('../utils/errorHandler');
const { getBaseUrl } = require('../config');
const adyenService = require('../services/adyenService');
const paymentService = require('../services/paymentService');
const { shouldRouteCancelledToPending } = require('../utils/paymentMethodOverrides');

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

    // Enforce country per payment method where applicable
    const methodLower = String(paymentMethod).toLowerCase();
    if (methodLower === 'vipps') {
      selectedCountry = 'NO';
    } else if (methodLower === 'mobilepay') {
      selectedCountry = 'DK';
    }
    
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

    // Persist payment method metadata for later redirect handling
    try {
      paymentService.storeOrderMetadata(orderRef, { paymentMethod, selectedCountry });
    } catch (e) {
      console.warn('Failed to store order metadata', e);
    }
    
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
      
      // If payment status is "Received" or "Pending", note that this is a transient state
      // The status will be updated via webhooks once processing completes
      if (response.resultCode === 'Received' || response.resultCode === 'Pending') {
        console.log(`Payment ${orderRef} is in transient state: ${response.resultCode}. Final status will be updated via webhook.`);
      }
    }

    // Store redirect data for potential status check
    const redirectData = {
      redirectResult: redirect.redirectResult || redirect.payload,
      sessionId: redirect.sessionId
    };
    
    // Encode the redirect data to pass to result page
    const encodedRedirectData = encodeURIComponent(JSON.stringify(redirectData));

    // Redirect based on result code
    // Fetch stored metadata to enable method-specific handling (e.g., MobilePay workaround)
    const metadata = paymentService.getOrderMetadata(orderRef) || {};
    const method = (metadata.paymentMethod || '').toLowerCase();
    const metaCountry = metadata.selectedCountry;

    switch (response.resultCode) {
      case "Authorised":
        res.redirect(`/result/success?orderRef=${orderRef}&redirectData=${encodedRedirectData}`);
        break;
      case "Pending":
      case "Received":
        res.redirect(`/result/pending?orderRef=${orderRef}&redirectData=${encodedRedirectData}`);
        break;
      case "Refused":
        res.redirect(`/result/failed?orderRef=${orderRef}&redirectData=${encodedRedirectData}`);
        break;
      case "Error":
        // Treat generic Error as failed
        res.redirect(`/result/failed?orderRef=${orderRef}&redirectData=${encodedRedirectData}`);
        break;
      case "Cancelled":
        // Workaround sandbox-specific behavior only (decoupled for easy removal)
        if (shouldRouteCancelledToPending(method, metaCountry)) {
          console.log(`Workaround active: routing Cancelled to pending for order ${orderRef} (method=${method || 'unknown'}, country=${metaCountry})`);
          res.redirect(`/result/pending?orderRef=${orderRef}&redirectData=${encodedRedirectData}`);
        } else {
          res.redirect(`/result/failed?orderRef=${orderRef}&redirectData=${encodedRedirectData}`);
        }
        break;
      default:
        console.warn(`Unknown result code: ${response.resultCode}`);
        res.redirect(`/result/error?orderRef=${orderRef}&redirectData=${encodedRedirectData}`);
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

/**
 * Re-check payment status using redirect result
 */
const recheckPaymentStatus = asyncHandler(async (req, res) => {
  const { orderRef, redirectResult, sessionId } = req.body;
  
  if (!orderRef) {
    return res.status(400).json({
      error: 'Order reference is required',
      code: 'MISSING_ORDER_REF'
    });
  }
  
  if (!redirectResult && !req.body.payload) {
    return res.status(400).json({
      error: 'Redirect result or payload is required',
      code: 'MISSING_PAYMENT_DETAILS'
    });
  }
  
  try {
    // Prepare payment details
    const details = {};
    if (redirectResult) {
      details.redirectResult = redirectResult;
    } else if (req.body.payload) {
      details.payload = req.body.payload;
    }
    
    // Submit payment details to Adyen to get updated status
    const response = await adyenService.submitPaymentDetails(details);
    
    // Update stored status
    if (response.resultCode) {
      paymentService.storePaymentStatus(orderRef, response.resultCode);
      console.log(`Payment status re-checked for ${orderRef}: ${response.resultCode}`);
    }
    
    // Return the updated status
    res.json({
      orderRef,
      status: response.resultCode,
      pspReference: response.pspReference,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status re-check error:', {
      message: error.message,
      errorCode: error.errorCode,
      orderRef
    });
    
    res.status(500).json({
      error: 'Failed to re-check payment status',
      code: 'RECHECK_ERROR',
      details: error.message
    });
  }
});

module.exports = {
  createSession,
  handleShopperRedirect,
  getPaymentStatus,
  getAllPaymentStatuses,
  recheckPaymentStatus
};
