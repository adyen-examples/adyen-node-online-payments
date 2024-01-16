## Adyen [3D Secure 2 Authentication](https://docs.adyen.com/online-payments/3d-secure/) Integration Example

## Description

This repository shows the [Native](https://docs.adyen.com/online-payments/3d-secure/native-3ds2/) and [Redirect](https://docs.adyen.com/online-payments/3d-secure/redirect-3ds2/) flows for integrating 3DS2 payments using [Adyen.Drop-in and Components](https://github.com/Adyen/adyen-web).
We will go over the integration with the [sessions flow](https://docs.adyen.com/online-payments/build-your-integration/#create-payment-session) and the [advanced flow](https://docs.adyen.com/online-payments/build-your-integration/additional-use-cases/advanced-flow-integration/).

> **Note:** We've included a technical [blog post](https://www.adyen.com/knowledge-hub/a-guide-to-integrating-with-adyen-web-for-3d-secure-2-payments) that explains every step of this demo.

For additional information, refer to our [documentation on testing 3DS2](https://docs.adyen.com/development-resources/testing/3d-secure-2-authentication/).

## Prerequisites

- Node.js 18+

This demo leverages Adyen's API Library for Node.js ([GitHub](https://github.com/Adyen/adyen-node-api-library) | [Docs](https://docs.adyen.com/development-resources/libraries#javascript)).

## 1. Installation

1. Clone this repo:

```
git clone https://github.com/adyen-examples/adyen-node-online-payments.git
```

2. Build the frontend and backend. Navigate to the /3ds2-example and install dependencies:

The `frontend` directory is our client app. This is bootstrapped by [Vite](https://vitejs.dev/): a basic HTML web app with vanilla JavaScript.

The `backend` directory is our backend app. This is bootstrapped by [NestJS](https://nestjs.com/) and is written in TypeScript. This handles the native or redirect 3DS2, see services:

```
cd 3ds2-example/frontend && npm install
cd 3ds2-example/backend && npm install
```

## 2. Set the Environment Variables

1. Create a `./.env` file in the `/frontend`-folder with all required configuration & run `npm install`.

- [Client Key](https://docs.adyen.com/user-management/client-side-authentication)

```
ADYEN_CLIENT_KEY=YOUR_ADYEN_CLIENT_KEY
```

2. Create a `./.env` file in the `/backend`-folder with all required configuration & run `npm install`.

- [API key](https://docs.adyen.com/user-management/how-to-get-the-api-key)
- [Merchant Account](https://docs.adyen.com/account/account-structure)

```
ADYEN_API_KEY=YOUR_ADYEN_API_KEY
ADYEN_MERCHANT_ACCOUNT=YOUR_ADYEN_MERCHANT_ACCOUNT
```

> Note: You can use `.env.example` as reference.

3. In your Customer Area, remember to include `http://localhost:8080` in the list of Allowed Origins to allow the Adyen.Drop-in/Components to load. Otherwise an 'Invalid Origin'-error will occur.

## 3. Run the fullstack application

Once you have your .env file created and dependencies installed for both apps we can run both apps concurrently from the `root` directory:

```
npm install
npm run fullstack
```

This command will use the [concurrently](https://www.npmjs.com/package/concurrently) library to run both apps at the same time from one command.

The backend server should start up at `http://localhost:3000` and the frontend server at `http://localhost:8080`.

## 4. Usage
1. Visit `http://localhost:8080`
2. Select your integration-type and flow
3. Select `Card` and enter a [Test Card Number](https://docs.adyen.com/development-resources/testing/test-card-numbers/#test-3d-secure-2-authentication) that triggers the 3DS2 flow.


## Testing webhooks

Webhooks deliver asynchronous notifications and it is important to test them during the setup of your integration.
For this integration, the goal is to showcase the native and redirect 3DS2 flows. Hence why we do _not_ need to set up these when running this demo. For more information, read [this detailed blog post](https://www.adyen.com/blog/Integrating-webhooks-notifications-with-Adyen-Checkout).

## Contributing

We commit all our new features directly into our GitHub repository. Feel free to request or suggest new features or code changes yourself as well!

Find out more in our [Contributing](https://github.com/adyen-examples/.github/blob/main/CONTRIBUTING.md) guidelines.

## License

MIT license. For more information, see the **LICENSE** file in the root directory.
