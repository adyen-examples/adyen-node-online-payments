const clientKey = document.getElementById("clientKey").innerHTML;
const { AdyenCheckout, Redirect } = window.AdyenWeb;

// Function to create AdyenCheckout instance
async function createAdyenCheckout(session) {
  return AdyenCheckout({
    session: session,
    clientKey,
    environment: "test",
    amount: {
      value: 10000,
      currency: 'EUR'
    },
    locale: "en_US",
    countryCode: 'NL',
    showPayButton: true,
    // Note: For redirect payment methods like iDEAL, we don't set onPaymentCompleted/onPaymentFailed
    // The redirect flow will handle the result via /handleShopperRedirect
    onError: (error, component) => {
      console.error("onError", error.name, error.message, error.stack, component);
      window.location.href = "/result/error";
    },
  });
}

// Note: For redirect payment methods like iDEAL, the payment result is handled
// by the server-side /handleShopperRedirect endpoint, not by client-side handlers

// Function to start checkout
async function startCheckout() {
  try {
    const session = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(response => response.json());

    const checkout = await createAdyenCheckout(session);
    const ideal = new Redirect(checkout, {
      type: 'ideal'
    }).mount('#component-container');

  } catch (error) {
    console.error(error);
    alert("Error occurred. Look at console for details");
  }
}

startCheckout();
