const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const dotenv = require("dotenv");
const morgan = require("morgan");

const { uuid } = require("uuidv4");
const ShortUniqueId = require('short-unique-id');

const { hmacValidator } = require('@adyen/api-library');
const { Client, Config, TerminalCloudAPI } = require("@adyen/api-library");

const { getTables, getTable, getTableBySaleTransactionId, saveTable } = require('./storage.js')

// Unique ID for the system where you send this request from
const POS_SALE_ID = "SALE_ID_POS_42";


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
const terminalCloudAPI = new TerminalCloudAPI(client);

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

app.post("/api/create-payment", async (req, res) => {

  console.log("/api/create-payment");

  const tableName = req.body.tableName;
  const amount = req.body.amount;
  const currency = req.body.currency;
  const transactionId = uuid(); // unique transaction id

  const uid = new ShortUniqueId({ length: 10 });
  const serviceId = uid.rnd(); // unique 1-10 alphanumeric characters

  var table = getTable(tableName);

  table.paymentStatus = global.STATUS_INPROGRESS;
  table.paymentStatusDetails = { serviceId };
  saveTable(table);

  try {

    const response = await terminalCloudAPI.sync(
      {
        SaleToPOIRequest: {
          MessageHeader: {
            MessageClass: "Service",
            MessageCategory: "Payment",
            MessageType: "Request",
            ProtocolVersion: "3.0",
            ServiceID: serviceId,
            SaleID: POS_SALE_ID,
            POIID: process.env.ADYEN_POS_POI_ID
          },
          PaymentRequest: {
            SaleData: {
              SaleTransactionID: {
                TransactionID: transactionId,
                TimeStamp: new Date().toISOString()
              }
            },
            PaymentTransaction: {
              AmountsReq: {
                Currency: currency,
                RequestedAmount: parseFloat(amount)
              }
            }
          }
        }
      }
    );

    console.log(response);

    if (response === null) {

      table.paymentStatus = global.STATUS_NOTPAID;
      saveTable(table);

      res.status(400).json({
        result: "failure",
        refusalReason: "Empty payment response"
      });
    }

    const paymentResponse = response.SaleToPOIResponse.PaymentResponse;
    const POIData = paymentResponse.POIData;
    const saleData = paymentResponse.SaleData;

    switch (paymentResponse.Response.Result) {
      case "Success":

        table.paymentStatus = global.STATUS_PAID;
        table.paymentStatusDetails.poiTransactionId = POIData.POITransactionID.TransactionID;
        table.paymentStatusDetails.poiTransactionTimeStamp = POIData.POITransactionID.TimeStamp;
        table.paymentStatusDetails.saleTransactionId = saleData.SaleTransactionID.TransactionID;
        table.paymentStatusDetails.saleTransactionTimeStamp = saleData.SaleTransactionID.TimeStamp;

        console.log("Payment success - poiTransactionId: " + table.paymentStatusDetails.poiTransactionId);

        saveTable(table);

        res.json({ result: "success" });

        break;

      case "Failure":
        table.paymentStatus = global.STATUS_NOTPAID;
        table.paymentStatusDetails.refusalReason = "Payment terminal responded with: " + paymentResponse.Response.ErrorCondition;
        table.paymentStatusDetails.poiTransactionId = POIData.POITransactionID.TransactionID;
        table.paymentStatusDetails.poiTransactionTimeStamp = POIData.POITransactionID.TimeStamp;
        table.paymentStatusDetails.saleTransactionId = saleData.SaleTransactionID.TransactionID;
        table.paymentStatusDetails.saleTransactionTimeStamp = saleData.SaleTransactionID.TimeStamp;

        console.log("Payment failure - refusalReason: " + table.paymentStatusDetails.refusalReason);

        saveTable(table);

        res.json({
          result: "failure",
          "refusalReason": table.paymentStatusDetails.refusalReason
        });

        break;

      default:
        table.paymentStatus = global.STATUS_NOTPAID;
        table.paymentStatusDetails.refusalReason = ""
        table.paymentStatusDetails.poiTransactionId = "";
        table.paymentStatusDetails.poiTransactionTimeStamp = "";
        table.paymentStatusDetails.saleTransactionId = "";
        table.paymentStatusDetails.saleTransactionTimeStamp = "";

        console.log("Unexpected error");

        // save table data
        saveTable(table);

        res.status(400).json({
          Result: "failure",
          RefusalReason: "Unexpected error"
        });

        break;

    }

  } catch (err) {
    console.log(err);
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});

app.post("/api/create-reversal", async (req, res) => {

  const tableName = req.body.tableName;

  const uid = new ShortUniqueId({ length: 10 });
  const serviceId = uid.rnd(); // unique 1-10 alphanumeric characters

  var table = getTable(tableName);

  try {

    const response = await terminalCloudAPI.sync(
      {
        SaleToPOIRequest: {
          MessageHeader: {
            MessageClass: "Service",
            MessageCategory: "Reversal",
            MessageType: "Request",
            ProtocolVersion: "3.0",
            ServiceID: serviceId,
            SaleID: POS_SALE_ID,
            POIID: process.env.ADYEN_POS_POI_ID
          },
          ReversalRequest: {
            OriginalPOITransaction: {
              POITransactionID: {
                TransactionID: table.paymentStatusDetails.poiTransactionId,
                TimeStamp: new Date().toISOString()
              },
              POIID: process.env.ADYEN_POS_POI_ID
            },
            ReversalReason: "MerchantCancel",
          }
        }
      });

    console.log(response);

    if (response == null) {

      res.status(400).json({
        result: "failure",
        "refusalReason": "Empty reversal response"
      });
    }

    const paymentResponse = response.SaleToPOIResponse.ReversalResponse.Response;
    console.log(paymentResponse);

    switch (paymentResponse.Result) {
      case "Success":
        table.paymentStatus = global.STATUS_REFUNDINPROGRESS;

        console.log("Refund request is sent - poiTransactionId: " + table.paymentStatusDetails.poiTransactionId);

        // save table data
        saveTable(table);

        res.json({ result: "success" });

        break;

      case "Failure":
        table.paymentStatus = global.STATUS_REFUNDFAILED;

        console.log("Refund request has failed - error: " + paymentResponse.additionalResponse);

        // save table data
        saveTable(table);

        res.json({
          result: "failure",
          "refusalReason": "Payment terminal responded with " + paymentResponse.additionalResponse
        });

        break;

      case "Partial":
        throw new Error("Partial refund not implemented");

      default:
        res.status(400).json({
          result: "failure",
          "refusalReason": "Could not reach the terminal POI ID:" + process.env.ADYEN_POS_POI_ID
        });

        break;

    }

  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});

app.get("/api/abort/:tableName", async (req, res) => {

  const tableName = req.params.tableName;

  const uid = new ShortUniqueId({ length: 10 });
  const serviceId = uid.rnd(); // unique 1-10 alphanumeric characters

  var table = getTable(tableName);

  try {

    const response = await terminalCloudAPI.sync(
      {
        SaleToPOIRequest: {
          MessageHeader: {
            MessageClass: "Service",
            MessageCategory: "Abort",
            MessageType: "Request",
            ProtocolVersion: "3.0",
            ServiceID: serviceId,
            SaleID: POS_SALE_ID,
            POIID: process.env.ADYEN_POS_POI_ID
          },
          AbortRequest: {
            AbortReason: "MerchantAbort",
            MessageReference: {
              MessageCategory: "Payment",
              SaleID: POS_SALE_ID,
              ServiceID: table.paymentStatusDetails.serviceId  // ServiceID of the original transaction.
            }
          }
        }
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

// Index 
app.get("/", async (req, res) => {
  res.render("index");
});

// Cash Register 
app.get("/cashregister", async (req, res) => {
  res.render("cashregister", {
    title: "Adyen Admin Panel",
    data: getTables(),
    poiId: process.env.ADYEN_POS_POI_ID,
    saleId: POS_SALE_ID
  })
});

// Success
app.get("/result/success", (req, res) => {
  res.render("result", {
    title: "Adyen Admin Result",
    type: "success",
    msg: "Your request has been successfully processed."
  })
});

// Failure
app.get("/result/:status/:refusalReason", (req, res) => {

  switch (req.params.status) {
    case "failure":
      msg = req.params.refusalReason;
      break;

    default:
      throw new Error("Unexpected status: " + req.params.status)

  }

  res.render("result", {
    title: "Adyen Admin Result",
    type: "failed",
    msg: msg
  })
});

// Get transaction status 
app.get("/transaction-status/:tableName", async (req, res) => {

  const table = getTable(req.params.tableName);

  try {

    const uid = new ShortUniqueId({ length: 10 });
    const serviceId = uid.rnd(); // unique 1-10 alphanumeric characters  

    const response = await terminalCloudAPI.sync(
      {
        SaleToPOIRequest: {
          MessageHeader: {
            ProtocolVersion: "3.0",
            MessageClass: "Service",
            MessageCategory: "TransactionStatus",
            MessageType: "Request",
            ServiceID: serviceId,
            SaleID: POS_SALE_ID,
            POIID: process.env.ADYEN_POS_POI_ID
          },
          TransactionStatusRequest: {
            ReceiptReprintFlag: true,
            DocumentQualifier: [
              "CashierReceipt",
              "CustomerReceipt"
            ],
            MessageReference: {
              SaleID: POS_SALE_ID,
              ServiceID: table.paymentStatusDetails.serviceId,  // ServiceID of the original transaction.
              MessageCategory: "Payment"
            }
          }
        }
      });

    console.log(response);

    if (response == null) {
      throw new Error("Empty response");
    }

    if (response.SaleToPOIResponse.TransactionStatusResponse == null) {
      throw new Error("Empty TransactionStatusResponse");
    }

    const paymentResponse = response.SaleToPOIResponse.TransactionStatusResponse.RepeatedMessageResponse.RepeatedResponseMessageBody.PaymentResponse;

    res.render("transactionstatus", {
      title: "Adyen Terminal Transaction Status",
      type: "success",
      tableName: table.tableName,
      serviceId: table.paymentStatusDetails.serviceId,
      paymentResponse: paymentResponse,
      saleId: POS_SALE_ID
    })

  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);

    res.render("transactionstatus", {
      title: "Adyen Terminal Transaction Status",
      type: "failure",
      tableName: table.tableName,
      errorMessage: err.message,
      poiId: process.env.ADYEN_POS_POI_ID,
      saleId: POS_SALE_ID
    })
  }
});



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
  console.log(notification)

  // Handle the notification
  if (validator.validateHMAC(notification, hmacKey)) {
    // valid hmac: process event
    const merchantReference = notification.merchantReference;
    const eventCode = notification.eventCode;
    console.log("merchantReference:" + merchantReference + " eventCode:" + eventCode);

    // consume event asynchronously
    consumeEvent(notification);

    // acknowledge event has been consumed
    res.send('[accepted]')

  } else {
    // invalid hmac: do not send [accepted] response
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

  } else if (notification.eventCode == "CANCEL_OR_REFUND") {
    // webhook with payment CANCEL_OR_REFUND
    console.log("Payment cancel_or_refund - pspReference:" + notification.pspReference + " eventCode:" + notification.eventCode);

    const saleTransactionId = notification.MerchantReference;
    const table = getTableBySaleTransactionId(saleTransactionId);

    if (notification.success) {
      table.paymentStatus = global.STATUS_REFUNDED;
    } else {
      table.paymentStatus = global.STATUS_REFUNDFAILED;
    }
    saveTable(table);

  } else if (notification.eventCode == "REFUND_FAILED") {
    // webhook with payment refund failure
    console.log("Payment refund failed - pspReference:" + notification.pspReference + " eventCode:" + notification.eventCode);

    const saleTransactionId = notification.MerchantReference;
    const table = getTableBySaleTransactionId(saleTransactionId);

    table.paymentStatus = global.STATUS_REFUNDFAILED;
    saveTable(table);

  } else if (notification.eventCode == "REFUNDED_REVERSED") {
    // webhook with payment refund reversed
    console.log("Payment refund reversed - pspReference:" + notification.pspReference + " eventCode:" + notification.eventCode);

    const saleTransactionId = notification.MerchantReference;
    const table = getTableBySaleTransactionId(saleTransactionId);
  
    table.paymentStatus = global.STATUS_REFUNDREVERSED;
    saveTable(table);

  } else {

    console.log("Unexpected eventCode: " + notification.eventCode);
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
