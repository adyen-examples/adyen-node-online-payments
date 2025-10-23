const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const dotenv = require("dotenv");
const morgan = require("morgan");
const { uuid } = require("uuidv4");

const { hmacValidator } = require('@adyen/api-library');
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");

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

// Adyen NodeJS library configuration
const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
const client = new Client({ config });
client.setEnvironment("TEST");  // change to LIVE for production
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
app.post("/api/sessions", async (req, res) => {

  try {
    // unique ref for the transaction
    const orderRef = uuid();
    // Dynamic URL detection for any environment (local, Codespaces, Gitpod, Railway, etc.)
    const host = req.get('host');
    const protocol = req.socket.encrypted? 'https' : 'http';
    
    // Check if we're in a cloud environment with a custom base URL
    const customBaseUrl = process.env.BASE_URL;
    const baseUrl = customBaseUrl || `${protocol}://${host}`;
    
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
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});


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
app.all("/handleShopperRedirect", async (req, res) => {
  console.log('=== REDIRECT RECEIVED ===');
  console.log('Method:', req.method);
  console.log('Query params:', req.query);
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  
  // Create the payload for submitting payment details
  const redirect = req.method === "GET" ? req.query : req.body;
  const details = {};
  if (redirect.redirectResult) {
    details.redirectResult = redirect.redirectResult;
  } else if (redirect.payload) {
    details.payload = redirect.payload;
  }
  
  console.log('Redirect details:', details);

  try {
    const response = await checkout.PaymentsApi.paymentsDetails({ details });
    // Conditionally handle different result codes for the shopper
    const orderRef = redirect.orderRef || 'unknown';
    
    // Store the payment status for later retrieval
    storePaymentStatus(orderRef, response.resultCode, response.resultCode);
    
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
        res.redirect(`/result/error?orderRef=${orderRef}`);
        break;
    }
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.redirect("/result/error");
  }
});

// Check payment status endpoint
app.get("/api/payment-status", async (req, res) => {
  try {
    const orderRef = req.query.orderRef;
    
    if (!orderRef) {
      return res.status(400).json({ message: 'Order reference is required' });
    }
    
    // In a real implementation, you would:
    // 1. Query your database for the payment record
    // 2. Check if the payment has been updated via webhook
    // 3. Return the current status from your database
    
    // For this demo, we'll check if we have a stored payment status
    // and if not, we'll call Adyen's API to get the current status
    
    // Check if we have a stored status (in production, this would be from your database)
    const storedStatus = getStoredPaymentStatus(orderRef);
    
    if (storedStatus) {
      // Return the stored status with additional info
      res.json({
        resultCode: storedStatus.resultCode,
        status: storedStatus.status,
        orderRef: orderRef,
        timestamp: new Date().toISOString(),
        lastUpdated: storedStatus.timestamp,
        source: 'stored'
      });
    } else {
      // If no stored status, assume it's still pending
      // In production, you might want to call Adyen's API here
      res.json({
        resultCode: 'Pending',
        status: 'Processing',
        orderRef: orderRef,
        timestamp: new Date().toISOString(),
        source: 'default'
      });
    }
    
  } catch (err) {
    console.error(`Error checking payment status: ${err.message}`);
    res.status(500).json({ message: 'Failed to check payment status' });
  }
});

// Simple in-memory storage for demo purposes
// In production, this would be a database
const paymentStatuses = new Map();

function getStoredPaymentStatus(orderRef) {
  return paymentStatuses.get(orderRef);
}

function storePaymentStatus(orderRef, resultCode, status) {
  paymentStatuses.set(orderRef, { resultCode, status, timestamp: new Date().toISOString() });
  console.log(`Stored payment status: ${orderRef} -> ${resultCode} (${status})`);
}

// Debug endpoint to see all stored payment statuses
app.get("/api/debug/payment-statuses", (req, res) => {
  const statuses = Object.fromEntries(paymentStatuses);
  res.json(statuses);
});

// Manual status update endpoint (for testing)
app.post("/api/manual-status-update", (req, res) => {
  try {
    const { orderRef, resultCode, status } = req.body;
    
    if (!orderRef || !resultCode) {
      return res.status(400).json({ message: 'orderRef and resultCode are required' });
    }
    
    storePaymentStatus(orderRef, resultCode, status || resultCode);
    
    res.json({
      message: 'Status updated successfully',
      orderRef,
      resultCode,
      status: status || resultCode,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error(`Error updating status: ${err.message}`);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

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
  
  // Store payment status updates
  if (merchantReference) {
    let resultCode = 'Pending';
    let status = 'Processing';
    
    // Map event codes to result codes
    switch (eventCode) {
      case 'AUTHORISATION':
        resultCode = success ? 'Authorised' : 'Refused';
        status = success ? 'Completed' : 'Failed';
        break;
      case 'CAPTURE':
        resultCode = success ? 'Authorised' : 'Refused';
        status = success ? 'Completed' : 'Failed';
        break;
      case 'REFUND':
        resultCode = 'Refunded';
        status = 'Refunded';
        break;
      case 'CANCELLATION':
        resultCode = 'Cancelled';
        status = 'Cancelled';
        break;
      default:
        // For other events, keep current status or set to pending
        const currentStatus = getStoredPaymentStatus(merchantReference);
        if (currentStatus) {
          resultCode = currentStatus.resultCode;
          status = currentStatus.status;
        }
        break;
    }
    
    // Store the updated status
    storePaymentStatus(merchantReference, resultCode, status);
    console.log(`Updated payment status for ${merchantReference}: ${resultCode} (${status})`);
  }
}



/* ################# end WEBHOOK ###################### */

/* ################# UTILS ###################### */

function getPort() {
  return process.env.PORT || 8080;
}

/* ################# end UTILS ###################### */

// Start server
app.listen(getPort(), () => console.log(`Server started -> http://localhost:${getPort()}`));
