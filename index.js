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

  try {
    // unique ref for the transaction
    const orderRef = uuid();
    // Allows for gitpod support
    const localhost = req.get('host');
    // const isHttps = req.connection.encrypted;
    const protocol = req.socket.encrypted? 'https' : 'http';
    // Ideally the data passed here should be computed based on business logic
    const response = await checkout.sessions({
      amount: { currency: "EUR", value: 1000 }, // value is 10€ in minor units
      countryCode: "NL",
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT, // required
      reference: orderRef, // required: your Payment Reference
      returnUrl: `${protocol}://${localhost}/api/handleShopperRedirect?orderRef=${orderRef}`, // set redirect URL required for some payment methods

      // For recurring payments, see https://docs.adyen.com/online-payments/tokenization/create-and-use-tokens?tab=subscriptions_2
      // and https://docs.adyen.com/api-explorer/#/CheckoutService/v69/post/sessions
      shopperInteraction : "Ecommerce",
      recurringProcessingModel: "Subscription",
      storePaymentMethod: true,
      shopperReference : uuid(), // use something sensible here, but no PII
    });

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
    const response = await checkout.paymentsDetails({ details });
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

// Checkout page (make a payment)
app.get("/checkout", (req, res) =>
  res.render("checkout", {
    type: req.query.type,
    clientKey: process.env.ADYEN_CLIENT_KEY
  })
);

// Result page
app.get("/result/:type", (req, res) =>
  res.render("result", {
    type: req.params.type,
  })
);

/* ################# end CLIENT SIDE ENDPOINTS ###################### */

/* ################# WEBHOOK ###################### */

app.post("/api/webhooks/notifications", async (req, res) => {

  // YOUR_HMAC_KEY from the Customer Area
  const hmacKey = process.env.ADYEN_HMAC_KEY;
  const validator = new hmacValidator()
  // Notification Request JSON
  const notificationRequest = req.body;
  const notificationRequestItems = notificationRequest.notificationItems

  // Handling multiple notificationRequests
  notificationRequestItems.forEach(function(notificationRequestItem) {

    const notification = notificationRequestItem.NotificationRequestItem

    // Handle the notification
    try{ 
      if( validator.validateHMAC(notification, hmacKey) ) {
        // Process the notification based on the eventCode
          const merchantReference = notification.merchantReference;
          const eventCode = notification.eventCode;
          if(eventCode == "RECURRING_CONTRACT") {
            console.log('Save that information for future subscription payments');
            console.log('shopperReference:' + notification.additionalData[recurring.shopperReference]);
            console.log('recurring.recurringDetailReference:' + notification.additionalData[recurring.recurringDetailReference]);

            // Later on, you can then initiate another payment directly from your server like this :
            // See https://docs.adyen.com/online-payments/tokenization/create-and-use-tokens?tab=codeBlockpay_shopper_in_session_yl7UI_JS_7#test-and-go-live

            // checkout.payments({
            //     amount: { currency: "USD", value: 2000 },
            //     paymentMethod: {
            //         type: 'scheme',
            //         storedPaymentMethodId: notification.additionalData[recurring.recurringDetailReference],
            //     },
            //     reference: "YOUR_ORDER_NUMBER",
            //     shopperReference:notification.additionalData[recurring.shopperReference],
            //     merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
            //     shopperInteraction: "ContAuth",
            //     recurringProcessingModel: "CardOnFile",
            //     returnUrl: "https://your-company.com/..."
            // }).then(res => res);

          }
          else{
            console.log('merchantReference:' + merchantReference + " eventCode:" + eventCode);
            console.log(JSON.stringify(notification));
          }
        } else {
          // invalid hmac: do not send [accepted] response
          console.log("Invalid HMAC signature: " + notification);
          res.status(401).send('Invalid HMAC signature');
      }
    } catch (err) {
      console.log("Erro validating HMAC Signature " + err.message);
    }
});

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
