const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const dotenv = require("dotenv");
const morgan = require("morgan");
const { uuid } = require("uuidv4");

const { hmacValidator } = require('@adyen/api-library');
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");

const { PaymentModel, PaymentDetailsModel, getAll, getByMerchantReference, addToHistory, updatePayment, put} = require('./storage.js')


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

// Adyen Node.js API library boilerplate (configuration, etc.)
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

/* ################# API ENDPOINTS ###################### */

// Get payment methods
app.post("/api/getPaymentMethods", async (req, res) => {
  try {
    const response = await checkout.PaymentsApi.paymentMethods({
      channel: "Web",
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
    });
    res.json(response);
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});

// submit additional payment details to complete the payment
app.post("/api/submitAdditionalDetails", async (req, res) => {
  // Create the payload for submitting payment details
  const payload = {
    details: req.body.details,
    paymentData: req.body.paymentData,
  };

  try {
    // Return the response back to client
    // (for further action handling or presenting result to shopper)
    const response = await checkout.PaymentsApi.paymentsDetails(payload);

    res.json(response);
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});

// Handle all redirects from payment type
app.all("/api/handleShopperRedirect", async (req, res) => {
  // Create the payload for submitting payment details
  const redirect = req.method === "GET" ? req.query : req.body;
  const details = {};
  if (redirect.redirectResult) {
    details.redirectResult = redirect.redirectResult;
  } else if (redirect.payload) {
    details.payload = redirect.payload;
  }

  try {
    const response = await checkout.PaymentsApi.paymentsDetails({ details });
    // Conditionally handle different result codes for the shopper
    switch (response.resultCode) {
      case "Authorised":
        res.redirect("/result/success");
        break;
      case "Pending":
      case "Received":
        res.redirect("/result/pending");
        break;
      case "Refused":
        res.redirect("/result/failed");
        break;
      default:
        res.redirect("/result/error");
        break;
    }
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.redirect("/result/error");
  }
});

// Pre-authorisation using the Payments API
app.post("/api/pre-authorisation", async (req, res) => {
  
  // find shopper IP from request
  const shopperIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  try {
    // unique ref for the transaction
    const orderRef = uuid();
    // Get host and protocol
    const localhost = req.get('host');
    const protocol = req.socket.encrypted? 'https' : 'http';    
    // Ideally the data passed here should be computed based on business logic
    const response = await checkout.PaymentsApi.payments({
      amount: { currency: "EUR", value: 24999 }, // value is 249.99€ in minor units
      reference: orderRef, // required
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT, // required
      channel: "Web", 
      paymentMethod: req.body.paymentMethod,
      additionalData: {
        // required for 3ds2 native flow
        allow3DS2: true,
        // Set `authorisationType` to `preAuth`
        authorisationType: "PreAuth",
      },
      origin: `${protocol}://${localhost}`, // required for 3ds2 native flow
      browserInfo: req.body.browserInfo, // required for 3ds2
      shopperIP, // required by some issuers for 3ds2
      returnUrl: `${protocol}://${localhost}/api/handleShopperRedirect?orderRef=${orderRef}`, // required for 3ds2 redirect flow
    });

    console.log(response);

    let expiryDate = new Date();
    // add 28 days for define pre-authorisation expiry date
    // The value of '28' varies per scheme, see https://docs.adyen.com/online-payments/adjust-authorisation/#validity.
    expiryDate.setDate(expiryDate.getDate() + 28);


    if(response.resultCode == 'Authorised') {
      // save payment into storage
      put(
        new PaymentModel(
          response.merchantReference, 
          response.pspReference, 
          response.amount.value, 
          response.amount.currency, 
          new Date(), // booking date
          expiryDate,
          response.paymentMethod.brand,
          [] // initialise history
      ));
    }

    res.json(response);
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});


/* ################# end API ENDPOINTS ###################### */

/* ################# CLIENT SIDE ENDPOINTS ###################### */

// Index (select a demo)
app.get("/", (req, res) => 
  res.render("index", {
    title: "Adyen Booking View"
  })
);

// View cart (continue to checkout)
app.get("/preview", (req, res) =>
res.render("preview", {
  title: "Adyen Booking Preview"
})
);

// Booking page (make a booking)
app.get("/booking", (req, res) =>
  res.render("booking", {
    title: "Adyen Booking Cart",
    clientKey: process.env.ADYEN_CLIENT_KEY
  })
);

// Result page
app.get("/result/:type", (req, res) =>
  res.render("result", {
    type: req.params.type,
  })
);

// Admin Panel screens

// Admin Panel page
app.get("/admin", (req, res) =>
  res.render("admin/index", {
    title: "Adyen Admin Panel",
    data: getAll()
  })
);

// Admin Panel result (after adjustment/capture)
app.get("/admin/result/:status/:reference", (req, res) => {

    if(req.params.status == "received") {
      result = "success"
    } else {
      result = "error"
    }

    res.render("admin/result", {
      title: "Adyen Admin Result",
      type: result,
      reference: req.params.reference,
      refusalReason: req.query.refusalReason
    })
}
);

// Admin Panel details 
app.get("/admin/details/:reference", (req, res) =>
  res.render("admin/details", {
    title: "Adyen Admin Payment History",
    data: getByMerchantReference(req.params.reference)
  })
);

// Admin Panel adjust (amount value or extend validity) 
app.post("/admin/update-payment-amount", async (req, res) => {

  try {

    const paymentModel = getByMerchantReference(req.body.reference);

    if(paymentModel == null) {
      throw Error("Payment not found in storage - Reference: " + req.body.reference);
    }

    const response = await checkout.ModificationsApi.updateAuthorisedAmount(
      paymentModel.pspReference, 
      {
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT, 
        amount: { currency: "EUR", value: req.body.amount }, 
        reference: req.body.reference,
        industryUsage: "delayedCharge"
      }
    )  
    console.log(response);
    res.json(response);

  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }

});

// Admin Panel capture (capture payment) 
app.post("/admin/capture-payment", async (req, res) => {

  try {

    const paymentModel = getByMerchantReference(req.body.reference);

    if(paymentModel == null) {
      throw Error("Payment not found in storage - Reference: " + req.body.reference);
    }

    const response = await checkout.ModificationsApi.captureAuthorisedPayment(
      paymentModel.pspReference, 
      {
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT, 
        amount: { currency: paymentModel.currency, value: paymentModel.amount }, 
        reference: paymentModel.merchantReference
      }
    )
    console.log(response);
    res.json(response);

  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }    
      
});

// Admin Panel reversal (refund or cancel payment) 
app.post("/admin/reversal-payment", async (req, res) => {

  try {

    const paymentModel = getByMerchantReference(req.body.reference);

    if(paymentModel == null) {
      throw Error("Payment not found in storage - Reference: " + req.body.reference);
    }

    const response = await checkout.ModificationsApi.refundOrCancelPayment(
      paymentModel.pspReference, 
      {
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT, 
        reference: paymentModel.merchantReference
      }
    )
    console.log(response);   
    res.json(response);

  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
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

  if (notification.eventCode == "AUTHORISATION") {
    // webhook with payment authorisation
    console.log("Payment authorized - pspReference:" + notification.pspReference + " eventCode:" + notification.eventCode);
   
    // save payment 
    savePayment(notification);

  } else if (notification.eventCode == "AUTHORISATION_ADJUSTMENT") {
    // webhook with authorisation adjustment
    console.log("Authorisation adjustment - pspReference:" + notification.pspReference + " eventCode:" + notification.eventCode);

    // save payment 
    savePayment(notification);

    if(notification.success) {
      // update amount and expiry date of the pre-auth payment

      let expiryDate = new Date();
      // add 28 days for define pre-authorisation expiry date
      // The value of '28' varies per scheme, see https://docs.adyen.com/online-payments/adjust-authorisation/#validity.
      expiryDate.setDate(expiryDate.getDate() + 28);
  
      updatePayment(notification.merchantReference, notification.amount.value, expiryDate);
    }

  } else if (notification.eventCode == "CAPTURE") {
    // webhook with payment capture
    console.log("Payment capture - pspReference:" + notification.pspReference + " eventCode:" + notification.eventCode);

    // save payment 
    savePayment(notification);

  } else if (notification.eventCode == "CAPTURE_FAILED") {
    // webhook with payment capture failure
    console.log("Payment capture failed - pspReference:" + notification.pspReference + " eventCode:" + notification.eventCode);

    // save payment 
    savePayment(notification);

  } else if (notification.eventCode == "CANCEL_OR_REFUND") {
    // webhook with payment CANCEL_OR_REFUND
    console.log("Payment cancel_or_refund - pspReference:" + notification.pspReference + " eventCode:" + notification.eventCode);

    // save payment 
    savePayment(notification);

  } else if (notification.eventCode == "REFUND_FAILED") {
    // webhook with payment refund failure
    console.log("Payment refund failed - pspReference:" + notification.pspReference + " eventCode:" + notification.eventCode);

    // save payment 
    savePayment(notification);

  } else if (notification.eventCode == "REFUNDED_REVERSED") {
    // webhook with payment refund reversed
    console.log("Payment refund reversed - pspReference:" + notification.pspReference + " eventCode:" + notification.eventCode);

    // save payment 
    savePayment(notification);

  } else {

    console.log("Unexpected eventCode: " + notification.eventCode);
  }

}

// add payment in storage
function savePayment(notification) {
  // save payment 

  addToHistory(
    new PaymentDetailsModel(
      notification.merchantReference, 
      notification.pspReference, 
      notification.originalReference, 
      notification.amount.value, 
      notification.amount.currency, 
      new Date(), 
      notification.eventCode, 
      notification.reason, 
      notification.paymentMethod,
      notification.success
  ));

}


/* ################# end WEBHOOK ###################### */

/* ################# UTILS ###################### */

function getPort() {
  return process.env.PORT || 8080;
}

/* ################# end UTILS ###################### */

// Start server
app.listen(getPort(), () => console.log(`Server started -> http://localhost:${getPort()}`));
