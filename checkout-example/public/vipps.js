const clientKey = document.getElementById("clientKey").innerHTML;
const { AdyenCheckout, Redirect } = window.AdyenWeb;

// Function to create AdyenCheckout instance
async function createAdyenCheckout(session) {
  return AdyenCheckout({
    session: session,
    clientKey,
    environment: "test",
    amount: {
      value: 10000, // 1000 NOK in minor units (10000 øre = 1000 NOK)
      currency: 'NOK' // Vipps uses Norwegian Krone
    },
    locale: "no_NO", // Norwegian locale for Vipps
    countryCode: 'NO', // Vipps is primarily used in Norway
    showPayButton: true,
    // Note: For redirect payment methods like Vipps, we don't set onPaymentCompleted/onPaymentFailed
    // The redirect flow will handle the result via /handleShopperRedirect
    onError: (error, component) => {
      console.error("onError", error.name, error.message, error.stack, component);
      window.location.href = "/result/error";
    },
  });
}

// Note: For redirect payment methods like Vipps, the payment result is handled
// by the server-side /handleShopperRedirect endpoint, not by client-side handlers

// Function to start checkout
async function startCheckout() {
  try {
    const session = await fetch('/api/sessions?type=vipps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(response => response.json());

    const checkout = await createAdyenCheckout(session);
    const vipps = new Redirect(checkout, {
      type: 'vipps'
    }).mount('#component-container');

  } catch (error) {
    console.error(error);
    alert("Error occurred. Look at console for details");
  }
}

startCheckout();
