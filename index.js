const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
const app = express();

// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// Parse cookie bodies, and allow setting/getting cookies
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "/public")));

// config() enables environment variables by
// parsing the .env file and assigning it to process.env
dotenv.config({
  path: "./.env"
});

// Adyen Node.js API library boilerplate (configuration, etc.)
const config = new Config();
config.apiKey = process.env.API_KEY;
const client = new Client({ config });
client.setEnvironment("TEST");
const checkout = new CheckoutAPI(client);

app.engine(
  "handlebars",
  hbs({
    defaultLayout: "main",
    layoutsDir: __dirname + "/views/layouts",
    partialsDir: __dirname + "/views/partials",
    helpers: require("./util/helpers")
  })
);

app.set("view engine", "handlebars");

// Index (select a demo)
app.get("/", (req, res) => res.render("index"));

// Cart (continue to checkout)
app.get("/preview", (req, res) =>
  res.render("preview", {
    type: req.query.type
  })
);

function findCurrency(type) {
  switch (type) {
    case "ach":
      return "USD";
    case "ideal":
    case "giropay":
    case "klarna_paynow":
    case "sepadirectdebit":
    case "directEbanking":
      return "EUR";
      break;
    case "wechatpayqr":
    case "alipay":
      return "CNY";
      break;
    case "dotpay":
      return "PLN";
      break;
    case "boletobancario":
      return "BRL";
      break;
    default:
      return "EUR";
      break;
  }
}

// Get payment methods
app.get("getPaymentMethods", (req, res) => {
  checkout
    .paymentMethods({
      channel: "Web",
      merchantAccount: process.env.MERCHANT_ACCOUNT
    })
    .then(response => {
      res.json(response);
    });
});

// Checkout page (make a payment)
app.get("/checkout/:type", (req, res) => {
  checkout
    .paymentMethods({
      channel: "Web",
      merchantAccount: process.env.MERCHANT_ACCOUNT
    })
    .then(response => {
      res.render("payment", {
        type: req.params.type,
        originKey: process.env.ORIGIN_KEY,
        response: JSON.stringify(response)
      });
    });
});

// Submitting a payment
app.post("/initiatePayment", (req, res) => {
  let currency = findCurrency(req.body.paymentMethod.type);

  checkout
    .payments({
      amount: { currency, value: 1000 },
      reference: "12345",
      merchantAccount: process.env.MERCHANT_ACCOUNT,
      shopperIP: "192.168.1.3",
      channel: "Web",
      additionalData: {
        allow3DS2: true
      },
      returnUrl: "http://localhost:8080/handleShopperRedirect",
      browserInfo: req.body.browserInfo,
      // riskData: req.body.riskData,
      paymentMethod: req.body.paymentMethod
    })
    .then(response => {
      let paymentMethodType = req.body.paymentMethod.type;
      let resultCode = response.resultCode;
      let redirectUrl =
        response.redirect !== undefined ? response.redirect.url : null;
      let action = null;

      if (response.action) {
        action = response.action;
        res.cookie("paymentData", action.paymentData);
      }

      res.json({ paymentMethodType, resultCode, redirectUrl, action });
    });
});

app.get("/handleShopperRedirect", (req, res) => {
  // Create the payload for submitting payment details
  let payload = {};
  payload["details"] = req.query;
  payload["paymentData"] = req.cookies["paymentData"];

  checkout.paymentsDetails(payload).then(response => {
    res.clearCookie("paymentData");
    // Conditionally handle different result codes for the shopper
    switch (response.resultCode) {
      case "Authorised":
        res.redirect("/success");
        break;
      case "Pending":
        res.redirect("/pending");
        break;
      case "Refused":
        res.redirect("/failed");
        break;
      default:
        res.redirect("/error");
        break;
    }
  });
});

app.post("/handleShopperRedirect", (req, res) => {
  // Create the payload for submitting payment details
  let payload = {};
  payload["details"] = req.body;
  payload["paymentData"] = req.cookies["paymentData"];

  checkout.paymentsDetails(payload).then(response => {
    res.clearCookie("paymentData");
    // Conditionally handle different result codes for the shopper
    switch (response.resultCode) {
      case "Authorised":
        res.redirect("/success");
        break;
      case "Pending":
        res.redirect("/pending");
        break;
      case "Refused":
        res.redirect("/failed");
        break;
      default:
        res.redirect("/error");
        break;
    }
  });
});

app.post("/submitAdditionalDetails", (req, res) => {
  // Create the payload for submitting payment details
  let payload = {};
  payload["details"] = req.body.details;
  payload["paymentData"] = req.body.paymentData;

  // Return the response back to client
  // (for further action handling or presenting result to shopper)
  checkout.paymentsDetails(payload).then(response => {
    let resultCode = response.resultCode;
    let action = response.action || null;

    res.json({ action, resultCode });
  });
});

// Authorised result page
app.get("/success", (req, res) => res.render("success"));

// Pending result page
app.get("/pending", (req, res) => res.render("pending"));

// Error result page
app.get("/error", (req, res) => res.render("error"));

// Refused result page
app.get("/failed", (req, res) => res.render("failed"));

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
