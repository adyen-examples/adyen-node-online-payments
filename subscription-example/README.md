# Adyen [Tokenization](https://docs.adyen.com/online-payments-tokenization) Integration Demo

[![Node.js CI](https://github.com/adyen-examples/adyen-node-online-payments/actions/workflows/build-subscription.yml/badge.svg)](https://github.com/adyen-examples/adyen-node-online-payments/actions/workflows/build-subscription.yml)
[![E2E (Playwright)](https://github.com/adyen-examples/adyen-node-online-payments/actions/workflows/e2e-subscription.yml/badge.svg)](https://github.com/adyen-examples/adyen-node-online-payments/actions/workflows/e2e-subscription.yml)

This repository includes a tokenization example for subscriptions. Within this demo app, you'll find a simplified version of a website that offers a music subscription service. 
The shopper can purchase a subscription and administrators can manage the saved (tokenized) payment methods on a separate admin panel. 
The panel allows admins to make payments on behalf of the shopper using this token. We refer to this token as `recurringDetailReference` in this application. 

## Workflow 

The sample app implements the following workflow:

* send a zero-auth transaction to request the Recurring Payment
* receive the webhook with the token (`recurringDetailReference`)
* perform a payment using the token
* receive the webhook with the payment authorisation

> **Note:** Checkout the technical [blog post](https://www.adyen.com/blog/use-adyen-tokenization-to-implement-recurring-in-dotnet) that explains every step of this demo.

![Subscription Demo](public/images/cardsubscription.gif)

This demo leverages Adyen's API Library for Node.js ([GitHub](https://github.com/Adyen/adyen-node-api-library) | [Docs](https://docs.adyen.com/development-resources/libraries#javascript)).


## Run integration on [Gitpod](https://gitpod.io/)
1. Open your [Adyen Test Account](https://ca-test.adyen.com/ca/ca/overview/default.shtml) and create a set of [API keys](https://docs.adyen.com/user-management/how-to-get-the-api-key).
    - [`ADYEN_API_KEY`](https://docs.adyen.com/user-management/how-to-get-the-api-key)
    - [`ADYEN_CLIENT_KEY`](https://docs.adyen.com/user-management/client-side-authentication)
    - [`ADYEN_MERCHANT_ACCOUNT`](https://docs.adyen.com/account/account-structure)


2. Go to [Gitpod Environmental Variables](https://gitpod.io/variables) and set the following variables: [`ADYEN_API_KEY`](https://docs.adyen.com/user-management/how-to-get-the-api-key), [`ADYEN_CLIENT_KEY`](https://docs.adyen.com/user-management/client-side-authentication) and [`ADYEN_MERCHANT_ACCOUNT`](https://docs.adyen.com/account/account-structure) with a scope of `*/*`


3. To allow the Adyen Drop-In and Components to load, add `https://*.gitpod.io` as allowed origin by going to your `ADYEN_MERCHANT_ACCOUNT` in the Customer Area: `Developers` → `API credentials` → Find your `ws_user` → `Client settings` → `Add Allowed origins`.
> **Warning** You should only allow wild card (*) domains in the **test** environment. In a **live** environment, you should specify the exact URL of the application.

This demo provides a simple webhook integration at `/api/webhooks/notifications`. For it to work, you need to provide a way for Adyen's servers to reach your running application on Gitpod and add a standard webhook in the Customer Area.


4. To receive notifications asynchronously, add a webhook: 
    - In the Customer Area go to `Developers` → `Webhooks` and add a new `Standard notification webhook`
    - Define username and password (Basic Authentication) to [protect your endpoint](https://docs.adyen.com/development-resources/webhooks/best-practices#security) - Basic authentication only guarantees that the notification was sent by Adyen, not that it wasn't modified during transmission
    - Generate the [HMAC Key](https://docs.adyen.com/development-resources/webhooks/verify-hmac-signatures) and set the `ADYEN_HMAC_KEY` in your [Gitpod Environment Variables](https://gitpod.io/variables) with a scope of `*/*` -  This key is used to [verify](https://docs.adyen.com/development-resources/webhooks/best-practices#security) whether the HMAC signature that is included in the notification, was sent by Adyen and not modified during transmission
    - For the URL, enter `https://gitpod.io` for now, we will need to update this webhook URL in step 7
    - Make sure that the `Recurring contract` setting is **enabled** on `Merchant` account-level - In the `Customer Area`, under `Developers` -> `Webhooks` -> `Settings` -> Enable `Recurring contract` on `Merchant`-level and hit "Save".
    - Make sure that your webhook sends the `RECURRING_CONTRACT` event when you've created the webhook
    - Make sure the webhook is **enabled** to send notifications


5. In the Customer Area, go to `Developers` → `Additional Settings` → Under `Payment` enable `Recurring Details` for subscriptions.


6. Click the button below to launch the application in Gitpod.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/adyen-examples/adyen-node-online-payments/tree/main/subscription-example)


7. Update your webhook in the Customer Area with the public url that is generated by Gitpod
   - In the Customer Area, go to `Developers` → `Webhooks` → Select your `Webhook` that is created in step 4 → `Server Configuration`
   - Update the URL of your application/endpoint (e.g. `https://8080-myorg-myrepo-y8ad7pso0w5.ws-eu75.gitpod.io/api/webhooks/notifications/`
   - Hit `Apply` → `Save changes` and Gitpod should be able to receive notifications

> **Note** When exiting Gitpod a new URL is generated, make sure to **update the Webhook URL** in the Customer Area as described in the final step. 
> You can find more information about webhooks in [this detailed blog post](https://www.adyen.com/blog/Integrating-webhooks-notifications-with-Adyen-Checkout).


## Run integration on localhost using a proxy
You will need Node.js 20+ to run this application locally.

1. Clone this repository.

```
git clone https://github.com/adyen-examples/adyen-node-online-payments
```

2. Open your [Adyen Test Account](https://ca-test.adyen.com/ca/ca/overview/default.shtml) and create a set of [API keys](https://docs.adyen.com/user-management/how-to-get-the-api-key).
    - [`ADYEN_API_KEY`](https://docs.adyen.com/user-management/how-to-get-the-api-key)
    - [`ADYEN_CLIENT_KEY`](https://docs.adyen.com/user-management/client-side-authentication)
    - [`ADYEN_MERCHANT_ACCOUNT`](https://docs.adyen.com/account/account-structure)


3. To allow the Adyen Drop-In and Components to load, add `https://localhost:5001` as allowed origin by going to your MerchantAccount in the Customer Area: `Developers` → `API credentials` → Find your `ws_user` → `Client settings` → `Add Allowed origins`.
> **Warning** You should only allow wild card (*) domains in the **test** environment. In a **live** environment, you should specify the exact URL of the application.

This demo provides a simple webhook integration at `/api/webhooks/notifications`. For it to work, you need to provide a way for Adyen's servers to reach your running application and add a standard webhook in the Customer Area. 
To expose this endpoint locally you can use a tunneling software (see point 4)

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

6. To receive notifications asynchronously, add a webhook: 
    - In the Customer Area go to `Developers` → `Webhooks` and add a new `Standard notification webhook`
    - Define username and password (Basic Authentication) to [protect your endpoint](https://docs.adyen.com/development-resources/webhooks/best-practices#security) - Basic authentication only guarantees that the notification was sent by Adyen, not that it wasn't modified during transmission
    - Generate the [HMAC Key](https://docs.adyen.com/development-resources/webhooks/verify-hmac-signatures) - This key is used to [verify](https://docs.adyen.com/development-resources/webhooks/best-practices#security) whether the HMAC signature that is included in the notification, was sent by Adyen and not modified during transmission
    - See script below that allows you to easily set your environmental variables
    - For the URL, enter `https://ngrok.io` for now - We will need to update this webhook URL in step 10
    - Make sure that the `Recurring contract` setting is **enabled** on `Merchant` account-level - In the `Customer Area`, under `Developers` -> `Webhooks` -> `Settings` -> Enable `Recurring contract` on `Merchant`-level and hit "Save".
    - Make sure that your webhook sends the `RECURRING_CONTRACT` event when you've created the webhook
    - Make sure the webhook is **enabled** to send notifications

    
7. Set the following environment variables in your terminal environment: `ADYEN_API_KEY`, `ADYEN_CLIENT_KEY`, `ADYEN_MERCHANT_ACCOUNT` and `ADYEN_HMAC_KEY`. Note that some IDEs will have to be restarted for environmental variables to be injected properly.

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

8. In the Customer Area, go to `Developers` → `Additional Settings` → Under `Payment` enable `Recurring Details` for subscriptions.


9. Start the application and visit localhost.

```shell
npm install
npm run dev
```

10. Update your webhook in your Customer Area with the public url that is generated.
    - In the Customer Area go to `Developers` → `Webhooks` → Select your `Webhook` that is created in step 6 → `Server Configuration`
    - Update the URL of your application/endpoint (e.g. `https://c991-80-113-16-28.ngrok.io/api/webhooks/notifications/`)
    - Hit `Apply` → `Save changes` and Gitpod should be able to receive notifications

> **Note** When exiting ngrok or Visual Studio a new URL is generated, make sure to **update the Webhook URL** in the Customer Area as described in the final step. 
> You can find more information about webhooks in [this detailed blog post](https://www.adyen.com/blog/Integrating-webhooks-notifications-with-Adyen-Checkout).



## Usage
To try out this application with test card numbers, visit [Test card numbers](https://docs.adyen.com/development-resources/test-cards/test-card-numbers). We recommend saving multiple test cards in your browser so you can test your integration faster in the future.

1. Visit the main page 'Shopper View' to test the application, enter one or multiple card details. Once the payment is authorized, you will receive a webhook notification with the recurringDetailReference. Enter multiple cards to receive multiple different recurringDetailReferences.

2. Visit 'Admin Panel' to find the saved recurringDetailReferences and choose to make a payment request or disable the recurringDetailReference.

3. Visit the Customer Area `Developers` → `API logs` to view your logs.

> **Note** We currently store these values in a local memory cache, if you restart/stop the application these values are lost. However, the tokens will still be persisted on the Adyen Platform.
> You can view the stored payment details by going to a recent payment of the shopper in the Customer Area: `Transactions` → `Payments` → `Shopper Details` → `Recurring: View stored payment details`.


