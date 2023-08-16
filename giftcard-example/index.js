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

// Invoke /sessions endpoint
app.post("/api/sessions", async (req, res) => {
  console.log("/api/sessions type: " + req.query.type);

  try {
    // unique ref for the transaction
    const orderRef = uuid();
    // Allows for gitpod support
    const localhost = req.get('host');
    // const isHttps = req.connection.encrypted;
    const protocol = req.socket.encrypted? 'https' : 'http';
    // Ideally the data passed here should be computed based on business logic
    const response = await checkout.PaymentsApi.sessions({
      amount: { currency: "EUR", value: 11000 }, // value is 110€ in minor units
      countryCode: "NL",
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT, // required
      reference: orderRef, // required: your Payment Reference
      returnUrl: `${protocol}://${localhost}/checkout?orderRef=${orderRef}`, // set redirect URL required for some payment methods (ie iDEAL)
      // set lineItems required for some payment methods (ie Klarna)
      lineItems: [
        {quantity: 1, amountIncludingTax: 5500 , description: "Sunglasses"},
        {quantity: 1, amountIncludingTax: 5500 , description: "Headphones"}
      ] 
    });

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

// Cart (continue to checkout)
app.get("/preview", (req, res) =>
  res.render("preview", {
    type: req.query.type,
  })
);

// Checkout page
app.get("/checkout", (req, res) => {
  if(req.query.type == 'dropin') {  
    // go to Checkout with Drop-in
    res.render("dropin/checkout", {
      type: req.query.type,
      clientKey: process.env.ADYEN_CLIENT_KEY
    })
  } else {
    // go to Checkout with Gift Card component
    res.render("giftcard/checkout", {
      type: req.query.type,
      clientKey: process.env.ADYEN_CLIENT_KEY
    })
  }
});

// Result page
app.get("/result/:type", (req, res) =>
  res.render("result", {
    type: req.params.type,
  })
);

/* ################# end CLIENT SIDE ENDPOINTS ###################### */

/* ################# WEBHOOK ###################### */

// Process incoming Webhook: get NotificationRequestItem, validate HMAC signature,
// consume the event asynchronously, send response ["accepted"]
app.post("/api/webhooks/notifications", async (req, res) => {

  // YOUR_HMAC_KEY from the Customer Area
  const hmacKey = process.env.ADYEN_HMAC_KEY;
  const validator = new hmacValidator()
  // Notification Request JSON
  const notificationRequest = req.body;
  const notificationRequestItems = notificationRequest.notificationItems

  // fetch first (and only) NotificationRequestItem
  const notification = notificationRequestItems[0].NotificationRequestItem

  if (!validator.validateHMAC(notification, hmacKey)) {
    // invalid hmac
    console.log("Invalid HMAC signature: " + notification);
    res.status(401).send('Invalid HMAC signature');
    return;
  }

  console.log("-- webhook payload ------");
  console.log(notification);

  // valid hmac: process event

  if (notification.eventCode == "AUTHORISATION") {
    // webhook with payment authorisation
    if(notification.success) {
      console.log("Payment authorized - pspReference:" + notification.pspReference + " eventCode:" + notification.eventCode);
    } else {
      console.log("Payment not authorized - pspReference:" + notification.pspReference + " reason:" + notification.reason);
    }
  } else if (notification.eventCode == "ORDER_OPENED") {
    // webhook with partial payment authorisation
    if(notification.success) {
      console.log("Order is opened - pspReference:" + notification.pspReference + " eventCode:" + notification.eventCode);
    } else {
      console.log("Order not authorized - pspReference:" + notification.pspReference + " reason:" + notification.reason);
    }
  } else if (notification.eventCode == "ORDER_CLOSED") {
    // webhook with last partial payment authorisation
    if(notification.success) {
      console.log("Order is closed - pspReference:" + notification.pspReference + " eventCode:" + notification.eventCode);
      
      // check Additional data
      let loop = true;
      let i = 1;

      while(loop) {   
        // looking for order-n-pspReference     
        if (notification.additionalData.hasOwnProperty(`order-${i}-pspReference`)) {
          let paymentPspReference = notification.additionalData[`order-${i}-pspReference`]
          let paymentAmount = notification.additionalData[`order-${i}-paymentAmount`]
          let paymentMethod = notification.additionalData[`order-${i}-paymentMethod`]
          console.log(`Payment #${i} pspReference:${paymentPspReference} amount:${paymentAmount} paymentMethod:${paymentMethod}`);
          i++;
        } else {
          loop = false;
        }
      }

    } else {
      console.log("Order not authorized - pspReference:" + notification.pspReference + " reason:" + notification.reason);
    }
  } else {
    console.log("Unexpected eventCode: " + notification.eventCode);
  }

  // acknowledge event has been consumed
  res.send('[accepted]')

});


/* ################# end WEBHOOK ###################### */

/* ################# UTILS ###################### */

function getPort() {
  return process.env.PORT || 8080;
}

/* ################# end UTILS ###################### */

// Start server
app.listen(getPort(), () => console.log(`Server started -> http://localhost:${getPort()}`));
