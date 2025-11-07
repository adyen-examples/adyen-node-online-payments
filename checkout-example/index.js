/**
 * Adyen Checkout Example - Main Application
 */

const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const morgan = require("morgan");

// Import configuration and validation
const { config, validateConfig } = require('./src/config');

// Import error handling
const { handleServerError } = require('./src/utils/errorHandler');

// Import controllers
const paymentsController = require('./src/controllers/paymentsController');
const webhooksController = require('./src/controllers/webhooksController');

// Initialize Express app
const app = express();

// Validate configuration at startup
try {
  validateConfig();
  console.log('Configuration validated successfully');
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}

// Middleware setup
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));

// Handlebars setup
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

// Payment endpoints
app.post("/api/sessions", paymentsController.createSession);
app.all("/handleShopperRedirect", paymentsController.handleShopperRedirect);
app.get("/api/payment-status/:orderRef", paymentsController.getPaymentStatus);
app.post("/api/recheck-payment-status", paymentsController.recheckPaymentStatus);
app.get("/api/debug/payment-statuses", paymentsController.getAllPaymentStatuses);

// Webhook endpoints
app.post("/api/webhooks/notifications", webhooksController.processWebhook);

/* ################# CLIENT SIDE ENDPOINTS ###################### */

// Index page
app.get("/", (req, res) => res.render("index"));

// Components page
app.get("/components", (req, res) => res.render("components"));

// Payment method pages
app.get("/checkout/card", (req, res) =>
  res.render("card", {
    clientKey: config.adyen.ADYEN_CLIENT_KEY
  })
);

app.get("/checkout/dropin", (req, res) =>
  res.render("dropin", {
    clientKey: config.adyen.ADYEN_CLIENT_KEY,
    showCountrySelector: true
  })
);

app.get("/checkout/ideal", (req, res) =>
  res.render("ideal", {
    clientKey: config.adyen.ADYEN_CLIENT_KEY
  })
);

app.get("/checkout/klarna", (req, res) =>
  res.render("klarna", {
    clientKey: config.adyen.ADYEN_CLIENT_KEY
  })
);

app.get("/checkout/sepa", (req, res) =>
  res.render("sepa", {
    clientKey: config.adyen.ADYEN_CLIENT_KEY
  })
);

app.get("/checkout/vipps", (req, res) =>
  res.render("vipps", {
    clientKey: config.adyen.ADYEN_CLIENT_KEY
  })
);

app.get("/checkout/mobilepay", (req, res) =>
  res.render("mobilepay", {
    clientKey: config.adyen.ADYEN_CLIENT_KEY
  })
);

app.get("/checkout/googlepay", (req, res) =>
  res.render("googlepay", {
    clientKey: config.adyen.ADYEN_CLIENT_KEY
  })
);

// Result page
app.get("/result/:type", (req, res) =>
  res.render("result", {
    type: req.params.type,
    orderRef: req.query.orderRef || 'N/A',
    redirectData: req.query.redirectData || null
  })
);

/* ################# ERROR HANDLING ###################### */

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

/* ################# SERVER STARTUP ###################### */

const port = config.server.port;
app.listen(port, () => {
  console.log(`Server started -> http://localhost:${port}`);
  console.log(`Environment: ${config.server.environment}`);
  console.log(`Adyen Environment: ${config.adyen.ADYEN_ENVIRONMENT}`);
  console.log(`Base URL: ${config.server.baseUrl || 'auto-detected'}`);
});