const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "/public")));
app.use(cookieParser());

// Set up the dotenv config
dotenv.config({
  path: "./.env"
});

// Adyen Node.js API library boilerplate (configuration, etc.)
const config = new Config();
config.apiKey = process.env.API_KEY;
config.merchantAccount = process.env.MERCHANT_ACCOUNT;
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

// Checkout page (make a payment)
app.get("/checkout/:type", (req, res) => {
  checkout
    .paymentMethods({
      amount: {
        currency: "EUR",
        value: 1000
      },
      countryCode: "NL",
      channel: "Web",
      merchantAccount: config.merchantAccount
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
app.post("/initiatePayment", jsonParser, (req, res) => {
  checkout
    .payments({
      amount: { currency: "EUR", value: 1000 },
      paymentMethod: req.body.paymentMethod,
      reference: "12345",
      merchantAccount: config.merchantAccount,
      shopperIP: "192.168.1.3",
      channel: "Web",
      browserInfo: {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
        acceptHeader:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
      },
      returnUrl: "http://localhost:3000/confirmation"
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

// Confirmation page
app.get("/confirmation", (req, res) => res.render("confirmation"));

// After completing the 3DS2 authentication, the shopper is redirected
// back to returnUrl via an HTTP POST, appended with MD and PaRes variables
app.post("/confirmation", (req, res) => {
  // Create the payload for submitting payment details
  let payload = {};
  let details = {};
  let reqBody = req.body;
  details["MD"] = reqBody["MD"];
  details["PaRes"] = reqBody["PaRes"];
  payload["details"] = details;
  payload["paymentData"] = req.cookies["paymentData"];

  checkout.paymentsDetails(payload).then(response => {
    res.clearCookie("paymentData");
    // Conditionally handle different result codes for the shopper
    // (a generic error page is used in this demo for simplicity)
    response.resultCode === "Authorised"
      ? res.redirect("/confirmation")
      : res.redirect("/error");
  });
});

// Generic error page
app.get("/error", (req, res) => res.render("error"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
