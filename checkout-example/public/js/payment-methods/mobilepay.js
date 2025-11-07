// MobilePay payment method implementation
// This file handles the MobilePay payment component integration

const clientKey = document.getElementById("clientKey").innerHTML;
const { AdyenCheckout, Redirect } = window.AdyenWeb;

// Function to create AdyenCheckout instance
async function createAdyenCheckout(session) {
  return AdyenCheckout({
    session: session,
    clientKey,
    environment: "test",
    amount: {
      value: 10000, // 100 DKK in minor units (10000 øre = 100 DKK)
      currency: 'DKK' // MobilePay uses Danish Krone
    },
    locale: "da_DK", // Danish locale for MobilePay
    countryCode: 'DK', // MobilePay is primarily used in Denmark
    showPayButton: true,
    // Note: For redirect payment methods like MobilePay, we don't set onPaymentCompleted/onPaymentFailed
    // The redirect flow will handle the result via /handleShopperRedirect
    onError: (error, component) => {
      console.error("onError", error.name, error.message, error.stack, component);
      window.location.href = "/result/error";
    },
  });
}

// Note: For redirect payment methods like MobilePay, the payment result is handled
// by the server-side /handleShopperRedirect endpoint, not by client-side handlers

// Main function to start the checkout process
async function startCheckout() {
  try {
    // Starting MobilePay checkout
    
    // Fetch session from API
    const session = await fetch('/api/sessions?type=mobilepay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(response => response.json());

    const checkout = await createAdyenCheckout(session);
    const mobilepay = new Redirect(checkout, {
      type: 'mobilepay'
    }).mount('#mobilepay-container');
    
    // MobilePay component created and mounted

  } catch (error) {
    console.error('MobilePay checkout error:', error);
    if (window.errorHandler) {
      window.errorHandler.showErrorNotification(error);
    } else {
      alert("Error occurred. Look at console for details");
    }
  }
}

// Start the checkout process
startCheckout();
