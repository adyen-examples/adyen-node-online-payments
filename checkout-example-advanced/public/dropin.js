const clientKey = document.getElementById("clientKey").innerHTML;
const { AdyenCheckout, Dropin } = window.AdyenWeb;

// Used to finalize a checkout call in case of redirect
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('sessionId'); // Unique identifier for the payment session
const redirectResult = urlParams.get('redirectResult');

async function startCheckout() {
  try {
    const paymentMethodsResponse = await fetch('/api/paymentMethods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(response => response.json());

    const configuration = {
      paymentMethodsResponse: paymentMethodsResponse,
      clientKey,
      environment: "test",
      amount: {
        value: 1000,
        currency: 'USD'
      },
      locale: "en_US",
      countryCode: 'US',
      showPayButton: true,
      // override Security Code label
      translations: {
        'en-US': {
          'creditCard.securityCode.label': 'CVV/CVC'
        }
      },
      onSubmit: async (state, component, actions) => {
        console.info("onSubmit", state, component, actions);
        console.log("STATE DATA", state.data);
        try {
          if (state.isValid) {
            console.log("STATE DATA", state.data);
            const { action, order, resultCode } = await fetch("/api/payments", {
              method: "POST",
              body: state.data ? JSON.stringify(state.data) : "",
              headers: {
                "Content-Type": "application/json",
              }
            }).then(response => response.json());

            if (!resultCode) {
              console.warn("reject");
              actions.reject();
            }

            actions.resolve({
              resultCode,
              action,
              order
            });
          }
        } catch (error) {
          console.error(error);
          actions.reject();
        }
      },
      onPaymentCompleted: (result, component) => {
        console.info("onPaymentCompleted", result, component);
        handleOnPaymentCompleted(result.resultCode);
      },
      onPaymentFailed: (result, component) => {
        console.info("onPaymentFailed", result, component);
        handleOnPaymentFailed(result.resultCode);
      },
      onError: (error, component) => {
        console.error("onError", error.name, error.message, error.stack, component);
        window.open("/result/error", "_blank");
      },
      // Used for the Native 3DS2 Authentication flow, see: https://docs.adyen.com/online-payments/3d-secure/native-3ds2/
      onAdditionalDetails: async (state, component, actions) => {
        console.info("onAdditionalDetails", state, component);
        try {
          const { resultCode } = await fetch("/api/payments/details", {
            method: "POST",
            body: state.data ? JSON.stringify(state.data) : "",
            headers: {
              "Content-Type": "application/json",
            }
          }).then(response => response.json());

          if (!resultCode) {
            console.warn("reject");
            actions.reject();
          }

          actions.resolve({ resultCode });
        } catch (error) {
          console.error(error);
          actions.reject();
        }
      }
    };

    const paymentMethodsConfiguration = {
      card: {
        showBrandIcon: true,
        hasHolderName: true,
        holderNameRequired: true,
        name: "Credit or debit card",
        amount: {
          value: 1000,
          currency: "USD",
        },
        placeholders: {
          cardNumber: '1234 5678 9012 3456',
          expiryDate: 'MM/YY',
          securityCodeThreeDigits: '123',
          securityCodeFourDigits: '1234',
          holderName: 'J. Smith'
        }
      },
      paypal: {
        "environment": "test",
        merchantId: "BSNDBLAWPMZCE",
        intent: "authorize", // Change to "capture" if you want to capture the payment directly
      }
    };

    // Start the AdyenCheckout and mount the element onto the 'payment' div.
    const adyenCheckout = await AdyenCheckout(configuration);
    const dropin = new Dropin(adyenCheckout, {
      paymentMethodsConfiguration: paymentMethodsConfiguration
    }).mount('#dropin-container');

  } catch (error) {
    console.error(error);
    alert("Error occurred. Look at console for details.");
  }
}

// Function to handle payment completion redirects
function handleOnPaymentCompleted(resultCode) {
  switch (resultCode) {
    case "Authorised":
      window.open("/result/success", "_blank");
      break;
    case "Pending":
    case "Received":
      window.open("/result/pending", "_blank");
      break;
    default:
      window.open("/result/error", "_blank");
      break;
  }
}

// Function to handle payment failure redirects
function handleOnPaymentFailed(resultCode) {
  switch (resultCode) {
    case "Cancelled":
    case "Refused":
      window.open("/result/failed", "_blank");
      break;
    default:
      window.open("/result/error", "_blank");
      break;
  }
}

startCheckout();
