## Frontend for Payment Authentication Intergration Examples

### Please note these apps are not intended to be production-ready, these apps are for demonstrative purposes to show how to integrate with Adyen payments for 3DS2 Authentication fullstack solution.

## How to use this app

This app is intended for educational and demo purposes. We cover the core flows for integrating with 3DS2 payments for both dropin and components, for sessions flow and advanced flow and for 3DS2 native or redirect flows.

The `frontend` directory is our client app. This is bootstrapped by [Vite](https://vitejs.dev/guide/#scaffolding-your-first-vite-project). It is a basic HTML web app with vanilla JavaScript. The goal is to show you how to work with the adyen web SDK agnostic of UI framework.

### Running the frontend solution

If you want to run the frontend solution standalone you can cd into the directory and install dependencies with:

`npm install`

Then create an `.env` file at the root and add the following environment variables:

```
ADYEN_CLIENT_KEY=YOUR_ADYEN_CLIENT_KEY
```

> Note: It's recommended by the [VITE documentation](https://vitejs.dev/guide/env-and-mode#env-files) to prefix your variables with `VITE_`, we chose to manually inject the `ADYEN_CLIENT_KEY` in our [`vite.config.ts`](vite.config.ts) configuration.

Once you have your .env file created and dependencies installed you can use the following commands to run the app:

`npm run dev`

This will run the app on a local dev server at http://localhost:8080

_Note:_ If you want to run on a different port you can change the port number in the `vite.config.ts` file.
