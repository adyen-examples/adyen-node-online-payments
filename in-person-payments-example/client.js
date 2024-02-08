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
    // Default: undefined, unless you want to override this to point to a different endpoint based on your region, see https://docs.adyen.com/point-of-sale/design-your-integration/terminal-api/#cloud.
    // Optionally, if you do not own an Adyen Terminal/POS (yet), you can test this application using Adyen's Mock Terminal-API Application on GitHub: https://github.com/adyen-examples/adyen-mock-terminal-api (see README).
    terminalApiCloudEndpoint: process.env.ADYEN_TERMINAL_API_CLOUD_ENDPOINT,

    apiKey: process.env.ADYEN_API_KEY,
    environment: "TEST" // change to LIVE for production
  });

  const client = new Client({ config });

  terminalCloudAPIClient = new TerminalCloudAPI(client);
}

client_init();

module.exports = { getClient }
