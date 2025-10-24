const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const dotenv = require("dotenv");
const morgan = require("morgan");
const { uuid } = require("uuidv4");

const { hmacValidator } = require('@adyen/api-library');
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");

// Import error handling utilities
const { 
  PaymentError, 
  ValidationError, 
  AdyenAPIError, 
  SessionError,
  ConfigurationError,
  AuthenticationError,
  handleServerError, 
  asyncHandler, 
  validateEnvironment,
  safeJsonParse,
  retryRequest,
  handleAdyenError
} = require('./utils/errorHandler');

// init app
const app = express();
// setup request logging
app.use(morgan("dev"));
// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// Serve client from build folder
app.use(express.static(path.join(__dirname, "/public")));

// enables environment variables by
// parsing the .env file and assigning it to process.env
dotenv.config({
  path: "./.env",
});

// Validate required environment variables
try {
  validateEnvironment();
} catch (error) {
  console.error('Environment validation failed:', error.message);
  process.exit(1);
}

// Adyen NodeJS library configuration
const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;

// Validate API key
if (!config.apiKey) {
  throw new PaymentError('ADYEN_API_KEY is required', 'CONFIGURATION_ERROR', 500);
}

const client = new Client({ config });
client.setEnvironment(process.env.NODE_ENV === 'production' ? "LIVE" : "TEST");
const checkout = new CheckoutAPI(client);

app.engine(
  "handlebars",
  hbs.engine({
    defaultLayout: "main",
    layoutsDir: __dirname + "/views/layouts",
    helpers: require("./util/helpers"),
  })
);

app.set("view engine", "handlebars");

// Middleware to add current year to all responses
app.use((req, res, next) => {
  res.locals.currentYear = new Date().getFullYear();
  next();
});

/* ################# API ENDPOINTS ###################### */

// Invoke /sessions endpoint
app.post("/api/sessions", asyncHandler(async (req, res) => {
  try {
    // unique ref for the transaction
    const orderRef = uuid();
    // Environment-agnostic URL detection
    const host = req.get('host');
    const protocol = req.socket.encrypted? 'https' : 'http';
    
    // Check for custom base URL override
    const customBaseUrl = process.env.BASE_URL;
    
    let baseUrl;
    if (customBaseUrl) {
      // Use custom base URL if provided
      baseUrl = customBaseUrl;
    } else {
      // Use the actual request host and protocol
      baseUrl = `${protocol}://${host}`;
    }
    
    console.log('URL detection:', {
      host,
      protocol,
      customBaseUrl,
      finalBaseUrl: baseUrl
    });
    
    // Get payment method type and country from query parameters
    const paymentMethod = req.query.type || 'default';
    let selectedCountry = req.query.country || 'NL';
    
    console.log('Received country parameter:', req.query.country);
    console.log('Type of country parameter:', typeof req.query.country);
    
    // Ensure we have just the country code, not an object
    if (typeof selectedCountry === 'string' && selectedCountry.startsWith('{')) {
      try {
        const parsed = JSON.parse(selectedCountry);
        selectedCountry = parsed.id || parsed;
        console.log('Parsed country object, extracted ID:', selectedCountry);
      } catch (e) {
        console.log('Failed to parse country as JSON, using as-is:', selectedCountry);
      }
    }
    
    console.log('Final selected country:', selectedCountry);
    
    // Configure currency and country based on payment method and selected country
    let currency = "EUR";
    let countryCode = selectedCountry;
    let lineItems = [
      {quantity: 1, amountIncludingTax: 5000 , description: "Sunglasses"},
      {quantity: 1, amountIncludingTax: 5000 , description: "Headphones"}
    ];
    
    // Vipps-specific configuration (only for Norway)
    if (paymentMethod === 'vipps' || selectedCountry === 'NO') {
      currency = "NOK";
      countryCode = "NO";
      lineItems = [
        {quantity: 1, amountIncludingTax: 5000 , description: "Sunglasses"},
        {quantity: 1, amountIncludingTax: 5000 , description: "Headphones"}
      ];
    }
    
    // Currency mapping for different countries
    const currencyMap = {
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
    };
    
    // Set currency based on country if not already set by payment method
    if (currencyMap[selectedCountry] && paymentMethod !== 'vipps') {
      currency = currencyMap[selectedCountry];
    }
    
    // Ideally the data passed here should be computed based on business logic
    const response = await checkout.PaymentsApi.sessions({
      amount: { currency: currency, value: 10000 }, // value is 100€/1000 NOK in minor units
      countryCode: countryCode,
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT, // required
      reference: orderRef, // required: your Payment Reference
      returnUrl: `${baseUrl}/handleShopperRedirect?orderRef=${orderRef}`, // set redirect URL required for some payment methods (ie iDEAL)
      // set lineItems required for some payment methods (ie Klarna)
      lineItems: lineItems
    });

    console.log('Session created with returnUrl:', `${baseUrl}/handleShopperRedirect?orderRef=${orderRef}`);
    res.json(response);
  } catch (err) {
    console.error('Session creation error:', {
      message: err.message,
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      orderRef,
      paymentMethod,
      selectedCountry
    });

    // Use the new Adyen error handler to properly map Adyen errors
    throw handleAdyenError(err);
  }
}));


/* ################# end API ENDPOINTS ###################### */

/* ################# CLIENT SIDE ENDPOINTS ###################### */

// Index (select a demo)
app.get("/", (req, res) => res.render("index"));

// Components page (show available payment method components)
app.get("/components", (req, res) => res.render("components", { hideFooter: true }));


app.get("/checkout/dropin", (req, res) =>
  res.render("dropin", {
    clientKey: process.env.ADYEN_CLIENT_KEY
  })
);

app.get("/checkout/card", (req, res) =>
  res.render("card", {
    clientKey: process.env.ADYEN_CLIENT_KEY,
    hideFooter: true
  })
);

app.get("/checkout/googlepay", (req, res) =>
  res.render("googlepay", {
    clientKey: process.env.ADYEN_CLIENT_KEY,
    hideFooter: true
  })
);

app.get("/checkout/ideal", (req, res) =>
  res.render("ideal", {
    clientKey: process.env.ADYEN_CLIENT_KEY,
    hideFooter: true
  })
);

app.get("/checkout/klarna", (req, res) =>
  res.render("klarna", {
    clientKey: process.env.ADYEN_CLIENT_KEY,
    hideFooter: true
  })
);

app.get("/checkout/sepa", (req, res) =>
  res.render("sepa", {
    clientKey: process.env.ADYEN_CLIENT_KEY,
    hideFooter: true
  })
);

app.get("/checkout/vipps", (req, res) =>
  res.render("vipps", {
    clientKey: process.env.ADYEN_CLIENT_KEY,
    hideFooter: true
  })
);


// Result page
app.get("/result/:type", (req, res) =>
  res.render("result", {
    type: req.params.type,
    orderRef: req.query.orderRef || 'N/A'
  })
);

// Handle redirect during payment. This gets called during the redirect flow
app.all("/handleShopperRedirect", asyncHandler(async (req, res) => {
  console.log('=== REDIRECT RECEIVED ===');
  console.log('Method:', req.method);
  console.log('Query params:', req.query);
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  
  try {
    // Create the payload for submitting payment details
    const redirect = req.method === "GET" ? req.query : req.body;
    const details = {};
    
    if (redirect.redirectResult) {
      details.redirectResult = redirect.redirectResult;
    } else if (redirect.payload) {
      details.payload = redirect.payload;
    } else {
      throw new ValidationError('Missing payment details', 'redirect_details');
    }
    
    console.log('Redirect details:', details);

    // Validate order reference
    const orderRef = redirect.orderRef;
    if (!orderRef) {
      throw new ValidationError('Missing order reference', 'orderRef');
    }

    // Store payment status for tracking
    const response = await retryRequest(async () => {
      return await checkout.PaymentsApi.paymentsDetails({ details });
    });

    // Store the result code for status tracking
    if (response.resultCode) {
      paymentStatuses.set(orderRef, response.resultCode);
      console.log(`Payment status stored for ${orderRef}: ${response.resultCode}`);
    }

    // Conditionally handle different result codes for the shopper
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
      default:
        console.warn(`Unknown result code: ${response.resultCode}`);
        res.redirect(`/result/error?orderRef=${orderRef}`);
        break;
    }
  } catch (err) {
    console.error('Redirect handling error:', {
      message: err.message,
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      redirectData: req.method === "GET" ? req.query : req.body
    });

    // Handle different types of errors
    if (err instanceof ValidationError) {
      throw err; // Re-throw validation errors
    } else if (err.statusCode >= 400 && err.statusCode < 500) {
      // Use the new Adyen error handler for API errors
      throw handleAdyenError(err);
    } else {
      throw new PaymentError(`Redirect handling failed: ${err.message}`, 'REDIRECT_ERROR', 500);
    }
  }
}));



/* ################# end CLIENT SIDE ENDPOINTS ###################### */

/* ################# WEBHOOK ###################### */

// Process incoming Webhook: get NotificationRequestItem, validate HMAC signature,
// consume the event asynchronously, send response status code 202
app.post("/api/webhooks/notifications", async (req, res) => {

  // YOUR_HMAC_KEY from the Customer Area
  const hmacKey = process.env.ADYEN_HMAC_KEY;
  const validator = new hmacValidator()
  // Notification Request JSON
  const notificationRequest = req.body;
  const notificationRequestItems = notificationRequest.notificationItems

  // fetch first (and only) NotificationRequestItem
  const notification = notificationRequestItems[0].NotificationRequestItem
  console.log(notification)
  
  // Handle the notification
  if( validator.validateHMAC(notification, hmacKey) ) {
    // valid hmac: process event
    const merchantReference = notification.merchantReference;
    const eventCode = notification.eventCode;
    console.log("merchantReference:" + merchantReference + " eventCode:" + eventCode);

    // consume event asynchronously
    consumeEvent(notification);

    // acknowledge event has been consumed
    res.status(202).send(); // Send a 202 response with an empty body

  } else {
    // invalid hmac
    console.log("Invalid HMAC signature: " + notification);
    res.status(401).send('Invalid HMAC signature');
  }

});

// process payload asynchronously
function consumeEvent(notification) {
  // add item to DB, queue or different thread
  
  const merchantReference = notification.merchantReference;
  const eventCode = notification.eventCode;
  const success = notification.success;
  
  console.log(`Processing webhook: ${eventCode} for ${merchantReference}, success: ${success}`);
  
  // In a real implementation, you would update your database here
  // based on the webhook event received from Adyen
}



/* ################# end WEBHOOK ###################### */

/* ################# UTILS ###################### */

function getPort() {
  return process.env.PORT || 8080;
}

/* ################# end UTILS ###################### */

// Global error handler middleware (must be last)
app.use(handleServerError);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
    path: req.path
  });
});

// Start server
const port = getPort();
app.listen(port, () => {
  console.log(`Server started -> http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Adyen Environment: ${process.env.NODE_ENV === 'production' ? 'LIVE' : 'TEST'}`);
});
