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
    // The redirect flow will handle the result via /handleShopperRedirect
    onError: (error, component) => {
      console.error("onError", error.name, error.message, error.stack, component);
      window.location.href = "/result/error";
    },
  });
}

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
    
    // Try to use dedicated UPI component if available, otherwise use Redirect
    let upi;
    if (UPI && typeof UPI === 'function') {
      upi = new UPI(checkout, {});
    } else {
      const upiType = session.paymentMethods?.find(pm => 
        pm.type === 'upi' || pm.type === 'upi_qr' || pm.type === 'upi_collect'
      )?.type || 'upi';
      upi = new Redirect(checkout, {
        type: upiType
      });
    }
    
    upi.mount('#component-container');

  } catch (error) {
    console.error(error);
    alert("Error occurred. Look at console for details");
  }
}

startCheckout();
