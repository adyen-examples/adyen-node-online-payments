import AdyenCheckout from "@adyen/adyen-web";
import "@adyen/adyen-web/dist/adyen.css";

import {
  getPaymentMethods,
  postDoPayment,
  postDoPaymentDetails,
} from "../../shared/payments";

import {
  renderResultTemplate,
  attachClickHandlerForReset,
  parseRedirectResultToRequestData,
} from "../../shared/utils";

const CLIENT_KEY = import.meta.env.VITE_CLIENT_KEY;

const dropinInit = async () => {
  console.log("init of dropin advanced flow.");
  const url = window.location.href;

  if (url.indexOf("redirectResult") !== -1) {
    console.log("redirectResult in the url");
    const requestData = parseRedirectResultToRequestData(url);

    const paymentDetailsResponse = await postDoPaymentDetails(requestData);

    console.log("/payments/details response:", paymentDetailsResponse);

    renderResultTemplate(paymentDetailsResponse.resultCode);
  } else {
    // first get all available payment methods
    const paymentMethods = await getPaymentMethods();

    // on additional details will fire for native, the result will be in the data.details object, this threeDSResult should be passed to the /payments/details to get the final state
    // however in the case of redirect the redirectResult is appended to the url on return to merchants browser so this result should be parsed from the url and passed to the /payments/details call to get the final state
    const onAdditionalDetails = async (state, dropinComponent) => {
      console.log("onadditionaldetails event", state);
      const requestData = {
        ...state.data,
      };

      const paymentDetailsResponse = await postDoPaymentDetails(requestData);
      dropinComponent.unmount();
      renderResultTemplate(paymentDetailsResponse.resultCode);
    };

    // here is where you handle the payment after the user enters their details and click pay
    // here you should send the request to /payments API with the state.data object and handle the response
    const onSubmit = async (state, dropinComponent) => {
      if (state.isValid) {
        const flowRadioValue = document.querySelector(
          "input[name=flow]:checked"
        ).value;
        const flow = flowRadioValue.toString().toUpperCase();
        const paymentResponse = await postDoPayment(state.data, { url, flow });
        if (paymentResponse.resultCode === "Authorised") {
          console.log(
            `response is ${paymentResponse.resultCode}, unmounting component and rendering result`
          );
          dropinComponent.unmount();
          renderResultTemplate(paymentResponse.resultCode);
        } else {
          console.log(
            "paymentResponse includes an action, passing action to dropin.handleAction function."
          );
          dropinComponent.handleAction(paymentResponse.action); // pass the response action object into the dropin HandleAction function
        }
      }
    };

    // create configuration object to pass into AdyenCheckout
    const checkoutConfig = {
      paymentMethodsResponse: paymentMethods,
      locale: "en_US",
      environment: "test",
      clientKey: CLIENT_KEY,
      analytics: { enabled: false }, // omit or set to true if you want to enable analytics, this can be helpful if we need to debug issues on the Adyen side
      onSubmit: onSubmit,
      onAdditionalDetails: onAdditionalDetails,
    };

    const checkout = await AdyenCheckout(checkoutConfig);
    console.log("created checkout instance with config:", checkoutConfig);

    // we don't need to store a reference to the dropin because the dropin component is self referencing, the instance will be returned as the second parameter in both the onSubmit and onAdditionalDetails events
    checkout.create("dropin").mount("#dropin-container");
    console.log("created and mounted dropin to #dropin-container");
  }
};

attachClickHandlerForReset();
dropinInit();
