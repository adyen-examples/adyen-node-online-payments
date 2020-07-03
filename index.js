const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const dotenv = require("dotenv");
const morgan = require("morgan");
const { uuid } = require("uuidv4");
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
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
config.apiKey = process.env.API_KEY;
const client = new Client({ config });
client.setEnvironment("TEST");
const checkout = new CheckoutAPI(client);

// A temporary store to keep payment data to be sent in additional payment details and redirects.
// This is more secure than a cookie. In a real application this should be in a database.
const paymentDataStore = {};

app.engine(
  "handlebars",
  hbs({
    defaultLayout: "main",
    layoutsDir: __dirname + "/views/layouts",
    partialsDir: __dirname + "/views/partials",
    helpers: require("./util/helpers"),
  })
);

app.set("view engine", "handlebars");

/* ################# API ENDPOINTS ###################### */

// Get payment methods
app.get("/api/getPaymentMethods", async (req, res) => {
  try {
    const response = await checkout.paymentMethods({
      channel: "Web",
      merchantAccount: process.env.MERCHANT_ACCOUNT,
    });
    res.json(response);
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});

// Submitting a payment
app.post("/api/initiatePayment", async (req, res) => {
  const currency = findCurrency(req.body.paymentMethod.type);
  const shopperIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  try {
    const orderRef = uuid();
    // Ideally the data passed here should be computed based on business logic
    const response = await checkout.payments({
      amount: { currency, value: 1000 }, // value is 10€ in minor units
      reference: orderRef,
      merchantAccount: process.env.MERCHANT_ACCOUNT,
      // @ts-ignore
      shopperIP,
      channel: "Web",
      additionalData: {
        // @ts-ignore
        allow3DS2: true,
      },
      returnUrl: `http://localhost:8080/api/handleShopperRedirect?orderRef=${orderRef}`,
      browserInfo: req.body.browserInfo,
      paymentMethod: req.body.paymentMethod.type.includes("boleto")
        ? {
            type: "boletobancario_santander",
          }
        : req.body.paymentMethod,
      // Required for Boleto:
      socialSecurityNumber: req.body.socialSecurityNumber,
      shopperName: req.body.shopperName,
      billingAddress:
        typeof req.body.billingAddress === "undefined" || Object.keys(req.body.billingAddress).length === 0
          ? null
          : req.body.billingAddress,
      deliveryDate: "2023-12-31T23:00:00.000Z",
      shopperStatement: "Aceitar o pagamento até 15 dias após o vencimento.Não cobrar juros. Não aceitar o pagamento com cheque",
      // Required for Klarna:
      countryCode: req.body.paymentMethod.type.includes("klarna") ? "DE" : null,
      shopperReference: "12345",
      shopperEmail: "youremail@email.com",
      shopperLocale: "en_US",
      lineItems: [
        {
          quantity: "1",
          amountExcludingTax: "331",
          taxPercentage: "2100",
          description: "Shoes",
          id: "Item 1",
          taxAmount: "69",
          amountIncludingTax: "400",
        },
        {
          quantity: "2",
          amountExcludingTax: "248",
          taxPercentage: "2100",
          description: "Socks",
          id: "Item 2",
          taxAmount: "52",
          amountIncludingTax: "300",
        },
      ],
    });

    let paymentMethodType = req.body.paymentMethod.type;
    let resultCode = response.resultCode;
    let redirectUrl = response.redirect !== undefined ? response.redirect.url : null;
    let action = null;

    if (response.action) {
      action = response.action;
      paymentDataStore[orderRef] = action.paymentData;
    }
    res.json({ paymentMethodType, resultCode, redirectUrl, action });
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});

// Handle all redirects from payment type
app.all("/api/handleShopperRedirect", async (req, res) => {
  // Create the payload for submitting payment details
  const payload = {};
  payload["details"] = req.method === "GET" ? req.query : req.body;
  const orderRef = req.query.orderRef;
  payload["paymentData"] = paymentDataStore[orderRef];
  delete paymentDataStore[orderRef];

  try {
    const response = await checkout.paymentsDetails(payload);
    // Conditionally handle different result codes for the shopper
    switch (response.resultCode) {
      case "Authorised":
        res.redirect("/success");
        break;
      case "Pending":
      case "Received":
        res.redirect("/pending");
        break;
      case "Refused":
        res.redirect("/failed");
        break;
      default:
        res.redirect("/error");
        break;
    }
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.redirect("/error");
  }
});

app.post("/api/submitAdditionalDetails", async (req, res) => {
  // Create the payload for submitting payment details
  const payload = {};
  payload["details"] = req.body.details;
  payload["paymentData"] = req.body.paymentData;

  try {
    // Return the response back to client
    // (for further action handling or presenting result to shopper)
    const response = await checkout.paymentsDetails(payload);
    let resultCode = response.resultCode;
    let action = response.action || null;

    res.json({ action, resultCode });
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

// Checkout page (make a payment)
app.get("/checkout/:type", async (req, res) => {
  try {
    const response = await checkout.paymentMethods({
      channel: "Web",
      merchantAccount: process.env.MERCHANT_ACCOUNT,
    });
    res.render("payment", {
      type: req.params.type,
      originKey: process.env.ORIGIN_KEY,
      response: JSON.stringify(response),
    });
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});

// Authorised result page
app.get("/success", (req, res) => res.render("success"));

// Pending result page
app.get("/pending", (req, res) => res.render("pending"));

// Error result page
app.get("/error", (req, res) => res.render("error"));

// Refused result page
app.get("/failed", (req, res) => res.render("failed"));

/* ################# end CLIENT SIDE ENDPOINTS ###################### */

/* ################# UTILS ###################### */

function findCurrency(type) {
  switch (type) {
    case "ach":
      return "USD";
    case "wechatpayqr":
    case "alipay":
      return "CNY";
    case "dotpay":
      return "PLN";
    case "boletobancario":
    case "boletobancario_santander":
      return "BRL";
    default:
      return "EUR";
  }
}

/* ################# end UTILS ###################### */

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
