## Backend for Payment Authentication Intergration Examples

### Please note these apps are not intended to be production-ready, these apps are for demonstrative purposes to show how to integrate with Adyen payments for 3DS2 Authentication fullstack solution.

## How to use this app

This app is intended for educational and demo purposes. We cover the core flows for integrating with 3DS2 payments for both dropin and components, for sessions floww anadvanced flowlow and for 3DS2 native or redirect flows.

The `backend` directory is our backend/server app. This is bootstrapped by [NestJS](https://docs.nestjs.com/) and is written in TypeScript. The goal is to show you how to pass the relevant authentication data to our payments API to initiate either native or redirect 3DS2. This backend demo has two services:

- `payments.service.ts` - this uses axios to call the API
- `paymentsWithCheckout.service.ts` - this uses the [adyen-api node library](https://www.npmjs.com/package/@adyen/api-library) to call the API.

The app is initiated using the `paymentsWithCheckout.service.ts` (recommended) but if you rather not use the [adyen-api node library](https://www.npmjs.com/package/@adyen/api-library) to swap out you just need to update the import for the service in the `payments.controller.ts` and `payments.module.ts` files to point to `payments.service.ts`.

### Running the backend solution

If you want to run the backend solution standalone you can cd into the directory and install dependencies with:

`npm install`

Then create an `.env` file at the root and add the following environment variables:

```
ADYEN_API_KEY="YOUR_ADYEN_API_KEY"
ADYEN_MERCHANT_ACCOUNT="YOUR_ADYEN_MERCHANT_ACCOUNT"
ADYEN_CLIENT_KEY="YOUR_ADYEN_CLIENT_KEY"
```

You can use the .env.example as reference.

Once you have your .env file created and dependencies installed you can use the following commands to run the app:

`npm run start`

This will run the app on a local dev server at http://localhost:3000

_Note:_ If you want to run on a different port you can change the port number in the main.ts file.
