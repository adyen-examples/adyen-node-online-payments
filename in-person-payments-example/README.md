# Adyen [In-person Payment Demo](https://docs.adyen.com/point-of-sale/) Integration Demo

[![Node.js CI](https://github.com/adyen-examples/adyen-node-online-payments/actions/workflows/build-in-person-payments.yml/badge.svg)](https://github.com/adyen-examples/adyen-node-online-payments/actions/workflows/build-in-person-payments.yml)

## Description
This demo shows developers how to use the Adyen [Cloud Terminal API](https://docs.adyen.com/point-of-sale/design-your-integration/choose-your-architecture/cloud/) `/terminal-api/sync` to make requests to your connected terminal.

The following implementations are included:
- [Payment requests](https://docs.adyen.com/point-of-sale/basic-tapi-integration/make-a-payment/)
- [Referenced refund requests](https://docs.adyen.com/point-of-sale/basic-tapi-integration/refund-payment/referenced/)
- [Cancel/abort requests](https://docs.adyen.com/point-of-sale/basic-tapi-integration/cancel-a-transaction/)
- [Transaction status requests](https://docs.adyen.com/point-of-sale/basic-tapi-integration/verify-transaction-status/)

There are typically two ways to integrate in-person payments: local or cloud communications.
To find out which solution (or hybrid) suits your needs, visit the following [documentation page](https://docs.adyen.com/point-of-sale/design-your-integration/choose-your-architecture/#choosing-between-cloud-and-local).

You can find the [Terminal API documentation](https://docs.adyen.com/point-of-sale/design-your-integration/terminal-api/terminal-api-reference/) here.

This demo integrates the Adyen's API Library for Node.js ([GitHub](https://github.com/Adyen/adyen-node-api-library) | [Docs](https://docs.adyen.com/development-resources/libraries#javascript)).

![In-person Payments Demo](public/images/cardinpersonpayments.gif)

## Prerequisites
- A [terminal device](https://docs.adyen.com/point-of-sale/user-manuals/) and a [test card](https://docs.adyen.com/point-of-sale/testing-pos-payments/) from Adyen
- [Adyen API Credentials](https://docs.adyen.com/development-resources/api-credentials/)
- Node.js 20+

## 1. Installation

```
git clone https://github.com/adyen-examples/adyen-node-api-library.git
```

## 2. Set the environment variables
* [API key](https://docs.adyen.com/user-management/how-to-get-the-api-key)
* [HMAC Key](https://docs.adyen.com/development-resources/webhooks/verify-hmac-signatures)
* `ADYEN_POS_POI_ID`: the unique ID of your payment terminal for the NEXO Sale to POI protocol. 
  - **Format:** `[device model]-[serial number]` **Example:** `V400m-123456789`

Create a `./.env` file with all required configuration

```
PORT=8080
ADYEN_API_KEY="your_API_key_here"
ADYEN_MERCHANT_ACCOUNT="your_merchant_account_here"
ADYEN_CLIENT_KEY="your_client_key_here"
ADYEN_HMAC_KEY="your_hmac_key_here"
ADYEN_POS_POI_ID=="your_pos_poi_id" 
```

## 3. Run the application

```
cd in-person-payments-example
npm install
npm run dev
```

Visit [http://localhost:8080/](http://localhost:8080/) and perform payments and refunds

# Webhooks

Webhooks deliver asynchronous notifications about the payment status and other events that are important to receive and process. 
You can find more information about webhooks in [this blog post](https://www.adyen.com/knowledge-hub/consuming-webhooks).

### Webhook setup

In the Customer Area under the `Developers → Webhooks` section, [create](https://docs.adyen.com/development-resources/webhooks/#set-up-webhooks-in-your-customer-area) a new `Standard webhook`.

A good practice is to set up basic authentication, copy the generated HMAC Key and set it as an environment variable. The application will use this to verify the [HMAC signatures](https://docs.adyen.com/development-resources/webhooks/verify-hmac-signatures/).

Make sure the webhook is **enabled**, so it can receive notifications.

The following webhooks `events` should be enabled:
* **AUTHORISATION**
* **CANCEL_OR_REFUND**
* **REFUND_FAILED**
* **REFUNDED_REVERSED**


### Expose an endpoint

This demo provides a simple webhook implementation exposed at `/api/webhooks/notifications` that shows you how to receive, validate and consume the webhook payload.

### Test your webhook

To make sure that the Adyen platform can reach your application, we have written a [Webhooks Testing Guide](https://github.com/adyen-examples/.github/blob/main/pages/webhooks-testing.md)
that explores several options on how you can easily achieve this (e.g. running on localhost or cloud).
