import AdyenCheckout from "@adyen/adyen-web";
import "@adyen/adyen-web/dist/adyen.css";

import { postDoSessions } from "../../shared/payments";

import { renderResultTemplate, attachClickHandlerForReset } from "../../shared/utils";

const CLIENT_KEY = import.meta.env.ADYEN_CLIENT_KEY;
let cardComponent = null;

const componentsInit = async () => {
  console.log("init of component sessions flow.");

  const url = window.location.href;

  const sessionsResponse = await postDoSessions({
    url,
  });

  console.log("/sessions response:", sessionsResponse);

  const { id, sessionData } = sessionsResponse;

  const onPaymentCompleted = (result, component) => {
    console.log("onpaymentcompleted event:", result, component);
    component.unmount();
    renderResultTemplate(result.resultCode);
  };

  const onError = (error) => {
    console.log("An error happened: ", error);
  };

  const customPayButton = document.querySelector(".component-pay-btn");

  customPayButton.addEventListener("click", () => {
    // first check there are no validation errors
    if (cardComponent.state.isValid) {
      console.log("call submit function on card component to start payment");
      cardComponent.submit(); // with sessions flow this submit function will do the payment

      customPayButton.classList.add("hide"); // clean up UI a bit
    }
  });

  // create configuration object to pass into AdyenCheckout
  const checkoutConfig = {
    locale: "en_US",
    environment: "test",
    clientKey: CLIENT_KEY,
    analytics: { enabled: false }, // omit or set to true if you want to enable analytics, this can be helpful if we need to debug issues on the Adyen side
    session: {
      id, // pass id from /session response
      sessionData, // pass sessionData from /session response
    },
    onPaymentCompleted: onPaymentCompleted,
    onError: onError,
    showPayButton: false, // if you want to use the prebuilt pay button (recommended) you can set true here but for demonstration purposes I will use a custom button for this example
  };

  const checkout = await AdyenCheckout(checkoutConfig);

  console.log("created checkout instance with config:", checkoutConfig);

  // here I store a reference to cardComponent so I can call the .submit function in my custom button to start the payment
  cardComponent = checkout.create("card").mount("#component-container");
  console.log("created and mounted card component to #component-container");
};

attachClickHandlerForReset();
componentsInit();
