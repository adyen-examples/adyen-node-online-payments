const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const morgan = require("morgan");

const webhookRoute = require('./routes/webhookRoute')
const apiRoute = require('./routes/apiRoute')
const webRoute = require('./routes/webRoute')

// Unique ID for the system where you send this request from
global.POS_SALE_ID = "SALE_ID_POS_42";


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


app.engine(
  "handlebars",
  hbs.engine({
    defaultLayout: "main",
    layoutsDir: __dirname + "/views/layouts",
    helpers: require("./util/helpers"),
  })
);

app.set("view engine", "handlebars");

// define routes
app.use("/api/webhooks/notifications", webhookRoute);
app.use("/api", apiRoute);
app.use("/", webRoute);

function getPort() {
  return process.env.PORT || 8080;
}

// Start server
app.listen(getPort(), () => console.log(`Server started -> http://localhost:${getPort()}`));
