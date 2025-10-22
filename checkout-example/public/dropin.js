const clientKey = document.getElementById("clientKey").innerHTML;
const { AdyenCheckout, Dropin } = window.AdyenWeb;

// Global variables to store checkout instance
let adyenCheckoutInstance = null;
let dropinInstance = null;

async function startCheckout(countryCode = 'NL') {
  try {
    // Create a new session with country parameter
    const session = await fetch(`/api/sessions?country=${encodeURIComponent(countryCode)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((response) => response.json());

    // Get locale for the country
    const locale = getLocaleForCountry(countryCode);
    
    const configuration = {
      session: session,
      clientKey,
      environment: "test",
      locale: locale,
      countryCode: countryCode,
      showPayButton: true,
      translations: {
        "en-US": {
          "creditCard.securityCode.label": "CVV/CVC",
        },
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
        window.location.href = "/result/error";
      },
    };

    const paymentMethodsConfiguration = {
      card: {
        showBrandIcon: true,
        hasHolderName: true,
        holderNameRequired: true,
        amount: {
          value: 10000,
          currency: session.amount.currency,
        },
        placeholders: {
          cardNumber: "1234 5678 9012 3456",
          expiryDate: "MM/YY",
          securityCodeThreeDigits: "123",
          securityCodeFourDigits: "1234",
          holderName: "J. Smith",
        },
      },
    };

    // Destroy existing instances if they exist
    console.log('Cleaning up existing instances...');
    if (dropinInstance) {
      console.log('Unmounting existing dropin instance');
      dropinInstance.unmount();
      dropinInstance = null;
    }
    if (adyenCheckoutInstance) {
      console.log('Clearing existing checkout instance');
      adyenCheckoutInstance = null;
    }

    // Clear the container
    const container = document.getElementById('dropin-container');
    if (container) {
      console.log('Clearing dropin container');
      container.innerHTML = '';
    }

    // Start the AdyenCheckout and mount the element onto the 'payment' div.
    adyenCheckoutInstance = await AdyenCheckout(configuration);
    dropinInstance = new Dropin(adyenCheckoutInstance, {
      paymentMethodsConfiguration: paymentMethodsConfiguration,
    }).mount("#dropin-container");
    
    // Store globally for country picker access
    window.adyenCheckoutInstance = adyenCheckoutInstance;
    
  } catch (error) {
    console.error(error);
    alert("Error occurred. Look at console for details.");
  }
}


// Function to handle payment completion redirects
function handleOnPaymentCompleted(resultCode) {
  switch (resultCode) {
    case "Authorised":
      window.location.href = "/result/success";
      break;
    case "Pending":
    case "Received":
      window.location.href = "/result/pending";
      break;
    default:
      window.location.href = "/result/error";
      break;
  }
}

// Function to handle payment failure redirects
function handleOnPaymentFailed(resultCode) {
  switch (resultCode) {
    case "Cancelled":
    case "Refused":
      window.location.href = "/result/failed";
      break;
    default:
      window.location.href = "/result/error";
      break;
  }
}

// Initialize with stored country or default to Netherlands
const storedCountry = localStorage.getItem('selectedCountry') || 'NL';
console.log('Dropin initializing with country:', storedCountry);

// Ensure we have just the country ID, not an object
let cleanCountryId = 'NL';
try {
    const parsed = JSON.parse(storedCountry);
    cleanCountryId = parsed.id || parsed;
} catch (e) {
    cleanCountryId = storedCountry;
}

console.log('Clean country ID for dropin:', cleanCountryId);
startCheckout(cleanCountryId);

// Listen for country changes from the country picker
window.addEventListener('countryChanged', (event) => {
    console.log('Country changed event received in dropin:', event.detail);
    const newCountryId = event.detail.countryId;
    console.log('Current country:', cleanCountryId, 'New country:', newCountryId);
    
    if (newCountryId && newCountryId !== cleanCountryId) {
        console.log('Reloading dropin with new country:', newCountryId);
        cleanCountryId = newCountryId; // Update the current country
        startCheckout(newCountryId);
    } else {
        console.log('No country change needed or invalid country ID');
    }
});

console.log('Dropin event listener registered for country changes');
