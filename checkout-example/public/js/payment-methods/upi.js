const clientKey = document.getElementById("clientKey").innerHTML;
const { AdyenCheckout, Redirect, UPI } = window.AdyenWeb;

// Function to create AdyenCheckout instance
async function createAdyenCheckout(session) {
  return AdyenCheckout({
    session: session,
    clientKey,
    environment: "test",
    amount: session.amount || {
      value: 10000,
      currency: 'INR'
    },
    locale: "en_US",
    countryCode: session.countryCode || 'IN',
    showPayButton: true,
    // Note: For redirect payment methods like UPI, we don't set onPaymentCompleted/onPaymentFailed
    // The redirect flow will handle the result via /handleShopperRedirect
    onError: (error, component) => {
      console.error("onError", error.name, error.message, error.stack, component);
      window.location.href = "/result/error";
    },
  });
}

// Note: For redirect payment methods like UPI, the payment result is handled
// by the server-side /handleShopperRedirect endpoint, not by client-side handlers

// Function to start checkout
async function startCheckout() {
  try {
    const session = await fetch('/api/sessions?type=upi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(response => response.json());

    const checkout = await createAdyenCheckout(session);
    
    // Use UPI class if available, otherwise fall back to Redirect
    let upiComponent;
    if (UPI && typeof UPI === 'function') {
      upiComponent = new UPI(checkout, {}).mount('#component-container');
    } else {
      upiComponent = new Redirect(checkout, {
        type: 'upi'
      }).mount('#component-container');
    }

  } catch (error) {
    console.error(error);
    alert("Error occurred. Look at console for details");
  }
}

startCheckout();
