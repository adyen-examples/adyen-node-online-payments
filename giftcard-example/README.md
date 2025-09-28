# Adyen [Gift Cards](https://docs.adyen.com/payment-methods/gift-cards) Integration Demo

[![Node.js CI](https://github.com/adyen-examples/adyen-node-online-payments/actions/workflows/build-giftcard.yml/badge.svg)](https://github.com/adyen-examples/adyen-node-online-payments/actions/workflows/build-giftcard.yml)
[![E2E (Playwright)](https://github.com/adyen-examples/adyen-node-online-payments/actions/workflows/e2e-giftcard.yml/badge.svg)](https://github.com/adyen-examples/adyen-node-online-payments/actions/workflows/e2e-giftcard.yml)

This repository includes examples of PCI-compliant UI integrations for online payments with Adyen. 
Within this demo app, you'll find a simplified version of an e-commerce website, complete with commented code to highlight key features and concepts of Adyen's API. 
Check out the underlying code to see how you can integrate Adyen to give your shoppers the option to pay with their preferred payment methods, all in a seamless checkout experience.

![Card gift card demo](wwwroot/images/cardgiftcard.gif)

This demo leverages Adyen's API Library for Node.js ([GitHub](https://github.com/Adyen/adyen-node-api-library) | [Docs](https://docs.adyen.com/development-resources/libraries#javascript)).

## Run demo in one-click

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new/adyen-examples/adyen-node-online-payments?ref=main&dev_container_path=.devcontainer%2Fgiftcard-example%2Fdevcontainer.json)  
[First time with Codespaces?](https://docs.github.com/en/codespaces/getting-started/quickstart)

For detailed setup instructions, see the [GitHub Codespaces Instructions](https://github.com/adyen-examples/.github/blob/main/pages/codespaces-instructions.md).

## Run integration on localhost using a proxy
You will need Node.js 20+ to run this application locally.

1. Clone this repository

```
git clone https://github.com/adyen-examples/adyen-node-online-payments.git
```


2. Open your [Adyen Test Account](https://ca-test.adyen.com/ca/ca/overview/default.shtml) and create a set of [API keys](https://docs.adyen.com/user-management/how-to-get-the-api-key). 
    - [`ADYEN_API_KEY`](https://docs.adyen.com/user-management/how-to-get-the-api-key)
    - [`ADYEN_CLIENT_KEY`](https://docs.adyen.com/user-management/client-side-authentication)
    - [`ADYEN_MERCHANT_ACCOUNT`](https://docs.adyen.com/account/account-structure)
    

3. To allow the Adyen Drop-In and Components to load, add `https://localhost:5001` as allowed origin by going to your `ADYEN_MERCHANT_ACCOUNT` in the Customer Area: `Developers` → `API credentials` → Find your `ws_user` → `Client settings` → `Add Allowed origins`.
> **Warning** You should only allow wild card (*) domains in the **test** environment. In a **live** environment, you should specify the exact URL of the application.

This demo provides a simple webhook integration at `/api/webhooks/notifications`. For it to work, you need to provide a way for Adyen's servers to reach your running application and add a standard webhook in the Customer Area.
To expose this endpoint you can use a tunneling software (i.e. ngrok).

4. Expose your localhost with tunneling software (i.e. ngrok).
    - Add `https://*.ngrok.io` to your allowed origins

If you use a tunneling service like ngrok, the webhook URL will be the generated URL (i.e. `https://c991-80-113-16-28.ngrok.io/api/webhooks/notifications/`).

```bash
  $ ngrok http 8080
  
  Session Status                online                                                                                           
  Account                       ############                                                                      
  Version                       #########                                                                                          
  Region                        United States (us)                                                                                 
  Forwarding                    http://c991-80-113-16-28.ngrok.io -> http://localhost:8080                                       
  Forwarding                    https://c991-80-113-16-28.ngrok.io -> http://localhost:8080           
```


5. To receive notifications asynchronously, add a webhook:
    - In the Customer Area go to `Developers` → `Webhooks` and add a new `Standard notification webhook`
    - Define username and password (Basic Authentication) to [protect your endpoint](https://docs.adyen.com/development-resources/webhooks/best-practices#security) - Basic authentication only guarantees that the notification was sent by Adyen, not that it wasn't modified during transmission
    - Generate the [HMAC Key](https://docs.adyen.com/development-resources/webhooks/verify-hmac-signatures) - This key is used to [verify](https://docs.adyen.com/development-resources/webhooks/best-practices#security) whether the HMAC signature that is included in the notification, was sent by Adyen and not modified during transmission
    - See script below that allows you to easily set your environmental variables
    - For the URL, enter `https://ngrok.io` for now - We will need to update this webhook URL in step 10
    - Make sure the webhook is **Enabled** to send notifications


6. Set the following environment variables in your terminal environment: `ADYEN_API_KEY`, `ADYEN_CLIENT_KEY`, `ADYEN_MERCHANT_ACCOUNT` and `ADYEN_HMAC_KEY`. Note that some IDEs will have to be restarted for environmental variables to be injected properly.

```shell
export ADYEN_API_KEY=yourAdyenApiKey
export ADYEN_MERCHANT_ACCOUNT=yourAdyenMerchantAccount
export ADYEN_CLIENT_KEY=yourAdyenClientKey
export ADYEN_HMAC_KEY=yourAdyenHmacKey
```

On Windows CMD you can use this command instead.

```shell
set ADYEN_API_KEY=yourAdyenApiKey
set ADYEN_MERCHANT_ACCOUNT=yourAdyenMerchantAccount
set ADYEN_CLIENT_KEY=yourAdyenClientKey
set ADYEN_HMAC_KEY=yourAdyenHmacKey
```


7. In the Customer Area, go to `Developers` → `Additional Settings` → Under `Acquirer` enable `Payment Account Reference` to receive the Payment Account Reference.


8. Start the application and visit localhost.


```shell
cd giftcard-example 
npm install
nom run dev
```

9. Update your webhook in your Customer Area with the public url that is generated.
  - In the Customer Area go to `Developers` → `Webhooks` → Select your `Webhook` that is created in step 6 → `Server Configuration`
  - Update the URL of your application/endpoint (e.g. `https://c991-80-113-16-28.ngrok.io/api/webhooks/notifications/` or `https://xd1r2txt-5001.euw.devtunnels.ms`)
  - Hit `Apply` → `Save changes` and the application should be able to receive notifications

> **Note** When exiting ngrok or Visual Studio a new URL is generated, make sure to **update the Webhook URL** in the Customer Area as described in the final step. 
> You can find more information about webhooks in [this detailed blog post](https://www.adyen.com/blog/Integrating-webhooks-notifications-with-Adyen-Checkout).


## Supported Integrations

Before testing, please make sure to [add the gift card payment method(s) to your Adyen Account](https://docs.adyen.com/payment-methods#add-payment-methods-to-your-account).


## Usage
To try out this application with test card numbers, visit [Gift card numbers](https://docs.adyen.com/development-resources/testing/test-card-numbers#gift-cards) and [Test card numbers](https://docs.adyen.com/development-resources/test-cards/test-card-numbers). 
We recommend saving some test cards in your browser so you can test your integration faster in the future.

1. Visit the main page, pick the Drop-in or Gift Card component integration, follow the instructions by entering the gift card number, followed by finalizing the payment.

2. Visit the Customer Area `Developers` → `API logs` to view your logs. 
