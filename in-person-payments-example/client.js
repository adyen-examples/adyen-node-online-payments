//
// Initialise TerminalCloudAPI client
//

const dotenv = require("dotenv");
const { Client, Config, TerminalCloudAPI } = require("@adyen/api-library");

// enables environment variables by
// parsing the .env file and assigning it to process.env
dotenv.config({
    path: "./.env",
});

var terminalCloudAPIClient;

const getClient = () => {
  return terminalCloudAPIClient;
}

function client_init() {
  if(process.env.ADYEN_API_KEY === undefined) {
    throw new Error("ADYEN_API_KEY undefined");
  }

  if(process.env.ADYEN_HMAC_KEY === undefined) {
    throw new Error("ADYEN_HMAC_KEY undefined");
  }
  
  if(process.env.ADYEN_POS_POI_ID === undefined) {
    throw new Error("ADYEN_POS_POI_ID undefined");
  }
  
  const config = new Config({
    apiKey: process.env.ADYEN_API_KEY,
    environment: "TEST" // change to LIVE for production
  });
  const client = new Client({ config });

  terminalCloudAPIClient = new TerminalCloudAPI(client);
}

client_init();

module.exports = { getClient }
