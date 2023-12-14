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
VITE_CLIENT_KEY=YOUR_CLIENT_KEY_HERE
```

You can use the .env.example as reference. Please note the `VITE_` prefix here is a requirement of vite, you may not need this prefix for your real implementation depending on the framework you use.

Once you have your .env file created and dependencies installed you can use the following commands to run the app:

`npm run dev`

This will run the app on a local dev server at http://localhost:3020

_Note:_ If you want to run on a different port you can change the port number in the vite.config.ts file.
