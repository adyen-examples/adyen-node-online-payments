const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const dotenv = require("dotenv");
const morgan = require("morgan");
const { uuid } = require("uuidv4");

const { hmacValidator } = require('@adyen/api-library');
const { Client, Config, CheckoutAPI, Recurring } = require("@adyen/api-library");

const { SHOPPER_REFERENCE, getAll, put, remove } = require('./storage.js')

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
  path: "../.env",
});

// Adyen Node.js API library boilerplate (configuration, etc.)
const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
const client = new Client({ config });
client.setEnvironment("TEST");  // change to LIVE for production
const checkout = new CheckoutAPI(client);
const recurring = new Recurring(client);

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

// Invoke tokenization endpoint
app.post("/api/tokenization/sessions", async (req, res) => {

  try {
    // unique ref for the transaction
    const orderRef = uuid();

    const host = req.get('host');
    const protocol = req.socket.encrypted ? 'https' : 'http';

    // perform /sessions call
    const response = await checkout.sessions({
      amount: { currency: "EUR", value: 0 }, // zero-auth transaction
      countryCode: "NL",
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT, // required
      reference: orderRef, // required: your Payment Reference
      shopperReference: SHOPPER_REFERENCE,
      returnUrl: `${protocol}://${host}/checkout?orderRef=${orderRef}`, // set redirect URL required for some payment methods (ie iDEAL)
      channel: "Web",
      // recurring payment settings
      shopperInteraction: "Ecommerce",
      recurringProcessingModel: "Subscription",
      enableRecurring: true
    });

    console.log(response);

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

// Subscription page (make a payment)
app.get("/subscription", (req, res) =>
  res.render("subscription", {
    type: req.query.type,
    clientKey: process.env.ADYEN_CLIENT_KEY
  })
);

// Admin Panel page
app.get("/admin", (req, res) =>
  res.render("admin/index", {
    data: getAll()
  })
);

// Result page
app.get("/result/:type", (req, res) =>
  res.render("result", {
    type: req.params.type,
  })
);

// Invoke to make a payment with a token
app.get("/admin/makepayment/:recurringDetailReference", async (req, res) => {

  console.log("/admin/makepayment/" + req.params.recurringDetailReference);

  let result = "success"

  try {
    const response = await checkout.payments({
      amount: { currency: "EUR", value: 1199 },
      reference: uuid(),
      shopperInteraction: "ContAuth", // Continuous Authorization
      recurringProcessingModel: "Subscription",
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
      shopperReference: SHOPPER_REFERENCE,
      paymentMethod: {
        storedPaymentMethodId: req.params.recurringDetailReference
      }
    });
    console.log(response);

    if (response.resultCode == "Authorised") {
      result = "success";
    } else {
      result = "error";
    }

  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    result = "error"
  }

  // Make Payment page
  res.render("admin/makePayment", {
    type: result,
    recurringDetailReference: req.params.recurringDetailReference
  })

});

// Invoke to disable a token
app.get("/admin/disable/:recurringDetailReference", async (req, res) => {

  console.log("/admin/disable/" + req.params.recurringDetailReference);

  let ret = "success"

  try {
    const response = await recurring.disable({
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
      shopperReference: SHOPPER_REFERENCE,
      recurringDetailReference: req.params.recurringDetailReference
    });
    console.log(response);

    // remove tokens from list
    remove(req.params.recurringDetailReference);

  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    ret = "error"
  }

  // Disable page
  res.render("admin/disable", {
    type: ret,
    recurringDetailReference: req.params.recurringDetailReference
  })

});


/* ################# end CLIENT SIDE ENDPOINTS ###################### */

/* ################# WEBHOOK ###################### */

// Process incoming Webhook notification: get NotificationRequestItem, validate HMAC signature,
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

  const shopperReference = notification.additionalData['recurring.shopperReference'];

  if (notification.eventCode == "AUTHORISATION" && shopperReference) {
    // webhook with recurring token
    const recurringDetailReference = notification.additionalData['recurring.recurringDetailReference'];
    const paymentMethod = notification.paymentMethod;

    console.log("Recurring authorized - recurringDetailReference:" + recurringDetailReference + " shopperReference:" + shopperReference +
      " paymentMethod:" + paymentMethod);

    // save token
    put(recurringDetailReference, paymentMethod, shopperReference)

  } else if (notification.eventCode == "AUTHORISATION") {
    // webhook with payment authorisation
    console.log("Payment authorized - pspReference:" + notification.pspReference + " eventCode:" + notification.eventCode);
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
