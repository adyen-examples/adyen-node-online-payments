import AdyenCheckout from "@adyen/adyen-web";
import "@adyen/adyen-web/dist/adyen.css";

import { postDoSessions } from "../../shared/payments";

import { renderResultTemplate, attachClickHandlerForReset } from "../../shared/utils";

const CLIENT_KEY = import.meta.env.ADYEN_CLIENT_KEY;

const dropinInit = async () => {
  console.log("init of dropin sessions flow");
  const url = window.location.href;

  const sessionsResponse = await postDoSessions({
    url,
  });

  console.log("/sessions response:", sessionsResponse);

  const { id, sessionData } = sessionsResponse;

  const onPaymentCompleted = (result, dropin) => {
    console.log("onpaymentcompleted event:", result);
    dropin.unmount();
    renderResultTemplate(result.resultCode);
  };

  const onError = (error) => {
    console.log("An error happened: ", error);
  };

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
  };

  const checkout = await AdyenCheckout(checkoutConfig);

  console.log("created checkout instance with config:", checkoutConfig);

  // we don't need to store a reference to the dropin because the dropin component is self referencing, the instance will be returned as the second parameter in both the onSubmit and onAdditionalDetails events
  checkout.create("dropin").mount("#dropin-container");

  console.log("created and mounted dropin to #dropin-container");
};

attachClickHandlerForReset();
dropinInit();
