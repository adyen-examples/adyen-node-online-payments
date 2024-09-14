# Adyen [Authorisation Adjustment](https://docs.adyen.com/online-payments/classic-integrations/modify-payments/adjust-authorisation) Integration Demo

[![Node.js CI](https://github.com/adyen-examples/adyen-node-online-payments/actions/workflows/build-authorisation-adjustment.yml/badge.svg)](https://github.com/adyen-examples/adyen-node-online-payments/actions/workflows/build-authorisation-adjustment.yml)
[![E2E (Playwright)](https://github.com/adyen-examples/adyen-node-online-payments/actions/workflows/e2e-authorisation-adjustment.yml/badge.svg)](https://github.com/adyen-examples/adyen-node-online-payments/actions/workflows/e2e-authorisation-adjustment.yml)

## Run demo in one-click

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/adyen-examples/dyen-node-online-payments/tree/main/authorisation-adjustment-example)  
&nbsp;[First time with Gitpod?](https://github.com/adyen-examples/.github/blob/main/pages/gitpod-get-started.md)

## Description

This repository includes an adjust authorisation example for the following three use cases after a pre-authorised payment: incremental, decremental adjustments. Within this demo app, you'll find a simplified version of a hotel booking, where the shopper perform a booking and administrators can **[1] adjust** (increase/decrease) the payment amount, **[2] extend** the authorisation expiry date, **[3] capture** the final amount and **[4] reverse** (cancel or refund) an authorised payment.

This demo leverages Adyen's API Library for Node.js ([GitHub](https://github.com/Adyen/adyen-node-api-library) | [Docs](https://docs.adyen.com/development-resources/libraries#javascript)).

> **Note:** We've included a technical [blog post](https://www.adyen.com/knowledge-hub/pre-authorizations-and-authorization-adjustments-for-developers) that explains every step of this demo.

![Authorisation Adjustment Demo](public/images/cardauthorisationadjustment.gif)

## Requirements

- [Adyen API Credentials](https://docs.adyen.com/development-resources/api-credentials/)
- Node.js 20+

## Installation

```
git clone https://github.com/adyen-examples/adyen-node-online-payments.git
```

## 2. Set the environment variables
* [API key](https://docs.adyen.com/user-management/how-to-get-the-api-key)
* [Client Key](https://docs.adyen.com/user-management/client-side-authentication)
* [Merchant Account](https://docs.adyen.com/account/account-structure)
* [HMAC Key](https://docs.adyen.com/development-resources/webhooks/verify-hmac-signatures)

Create a `./.env` file with the environment variables. 
```shell
export ADYEN_API_KEY=yourAdyenApiKey
export ADYEN_MERCHANT_ACCOUNT=yourAdyenMerchantAccount
export ADYEN_CLIENT_KEY=yourAdyenClientKey
export ADYEN_HMAC_KEY=yourHmacKey
```

## 3. Configure allowed origins (CORS)

It is required to specify the domain or URL of the web applications that will make requests to Adyen.

In the Customer Area add `http://localhost:8080` in the list of Allowed Origins associated with the Client Key.

## 4. Run the application

```
cd authorisation-adjustment-example
    
npm install
npm run dev
```

Visit [http://localhost:8080/](http://localhost:8080/).

Try out the different payment methods with our [test card numbers](https://docs.adyen.com/development-resources/test-cards/test-card-numbers) and other payment method details.

## 5. Usage

1. Make a booking in the `Booking View` 
2. Visit the `Admin Panel` to see the incoming webhooks and perform operations on the initial preauthorisation.

A success scenario for a payment followed by two adjustments, a capture and a reversal looks like: 

`AUTHORISATION` (preauthorisation) → `AUTHORISATION_ADJUSTMENT` (adjust) → `AUTHORISATION_ADJUSTMENT` (adjust) → `CAPTURE` (capture) → `CANCEL_OR_REFUND` (reversal)

Adyen expires an authorisation request automatically after XX days depending on the card brand.
The `EXTEND` operation in this sample is used to extend the expiry date manually, for the exact days, refer to the [documentation](https://docs.adyen.com/online-payments/adjust-authorisation/#validity) (section: validity).

When CAPTURE is executed, it will perform the operation on the latest amount. You'll have to wait for the `AUTHORISATION_ADJUSTMENT` response, before making the capture once it's final.


# Webhooks

Webhooks deliver asynchronous notifications about the payment status and other events that are important to receive and process. 
You can find more information about webhooks in [this blog post](https://www.adyen.com/knowledge-hub/consuming-webhooks).

### Webhook setup

In the Customer Area under the `Developers → Webhooks` section, [create](https://docs.adyen.com/development-resources/webhooks/#set-up-webhooks-in-your-customer-area) a new `Standard webhook`.

A good practice is to set up basic authentication, copy the generated HMAC Key and set it as an environment variable. The application will use this to verify the [HMAC signatures](https://docs.adyen.com/development-resources/webhooks/verify-hmac-signatures/).

Make sure the webhook is **enabled**, so it can receive notifications.

### Expose an endpoint

This demo provides a simple webhook implementation exposed at `/api/webhooks/notifications` that shows you how to receive, validate and consume the webhook payload.

### Test your webhook

The following webhooks `events` should be enabled:
* **AUTHORISATION**
* **AUTHORISATION_ADJUSTMENT**
* **CAPTURE**
* **CAPTURE_FAILED**
* **CANCEL_OR_REFUND**
* **REFUND_FAILED**
* **REFUND_REVERSED**


To make sure that the Adyen platform can reach your application, we have written a [Webhooks Testing Guide](https://github.com/adyen-examples/.github/blob/main/pages/webhooks-testing.md)
that explores several options on how you can easily achieve this (e.g. running on localhost or cloud).

