const paymentMethodsResponse = JSON.parse(
  document.getElementById("paymentMethodsResponse").innerHTML
);
const originKey = document.getElementById("originKey").innerHTML;
const type = document.getElementById("type").innerHTML;

const configuration = {
  paymentMethodsResponse,
  originKey,
  locale: "en_US",
  environment: "test",
  showPayButton: true,
  paymentMethodsConfiguration: {
    ideal: {
      showImage: true
    },
    card: {
      hasHolderName: true,
      holderNameRequired: true,
      name: "Credit or debit card",
      amount: {
        value: 1000,
        currency: "EUR"
      }
    }
  },
  onSubmit: (state, component) => {
    handleSubmission(state, component, "/initiatePayment");
  },
  onAdditionalDetails: (state, component) => {
    handleSubmission(state, component, "/submitAdditionalDetails");
  }
};

// Calls your server endpoints
function callServer(url, data) {
  return fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  }).then(res => res.json());
}

// Handles responses sent from your server to the client
function handleServerResponse(res, component) {
  if (res.action) {
    component.handleAction(res.action);
  } else {
    switch (res.resultCode) {
      case "Authorised":
        window.location.href = "/success";
        break;
      case "Pending":
        window.location.href = "/pending";
        break;
      case "Refused":
        window.location.href = "/failed";
        break;
      default:
        window.location.href = "/error";
        break;
    }
  }
}

// Event handlers called when the shopper selects the pay button,
// or when additional information is required to complete the payment
function handleSubmission(state, component, url) {
  if (state.isValid) {
    callServer(url, state.data)
      .then(res => handleServerResponse(res, component))
      .catch(error => {
        throw Error(error);
      });
  }
}

const checkout = new AdyenCheckout(configuration);

const integration = checkout.create(type).mount(document.getElementById(type));
