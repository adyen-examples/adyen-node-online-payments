const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const dotenv = require("dotenv");
const morgan = require("morgan");

const { hmacValidator } = require('@adyen/api-library');
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");

const { getAll, put, update } = require('./storage.js')


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
checkoutService = new CheckoutAPI(client);

app.engine(
  "handlebars",
  hbs.engine({
    defaultLayout: "main",
    layoutsDir: __dirname + "/views/layouts"
  })
);

app.set("view engine", "handlebars");

/* ################# API ENDPOINTS ###################### */

app.post("/api/links", async (req, res) => {

  // Allows for gitpod support
  const localhost = req.get('host');
  // const isHttps = req.connection.encrypted;
  const protocol = req.socket.encrypted? 'https' : 'http';  

  try {

    const response = await checkoutService.PaymentLinksApi.paymentLinks({
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT, // required
      amount: { currency: "EUR", value: req.body.Amount }, // value is 100€ in minor units
      reference: req.body.Reference,
      reusable: req.body.IsReusable,
      returnUrl: `${protocol}://${localhost}/`, // set redirect URL after payment
  });

  console.log(response);

  // save payment link
  put(response.id, response.reference, response.url, response.expiresAt, response.status, response.reusable);

  res.json(response.id);

  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});


/* ################# end API ENDPOINTS ###################### */

/* ################# CLIENT SIDE ENDPOINTS ###################### */

// Index (select a demo)
app.get("/", async (req, res) => { 
  
  // fetch and update all links
  for (const element of getAll()) { 
    // get Payment By Link
    const paymentLink = await checkoutService.PaymentLinksApi.getPaymentLink(element.id);
    // update local storage
    const pLink = { id: paymentLink.id, reference: paymentLink.reference, url:paymentLink.url, 
      expiresAt: paymentLink.expiresAt, status: paymentLink.status, isReusable: paymentLink.reusable }
    update(pLink);
  }

  res.render("index", {data: getAll()});
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
    console.log("merchantReference:" + merchantReference + " eventCode:" + eventCode + 
      " paymentLinkId:" + notification.additionalData.paymentLinkId);

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
  
}



/* ################# end WEBHOOK ###################### */

/* ################# UTILS ###################### */

function getPort() {
  return process.env.PORT || 8080;
}

/* ################# end UTILS ###################### */

// Start server
app.listen(getPort(), () => console.log(`Server started -> http://localhost:${getPort()}`));
