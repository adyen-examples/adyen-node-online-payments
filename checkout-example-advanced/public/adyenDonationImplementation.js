const clientKey = document.getElementById("clientKey").innerHTML;

// initialise Giving
async function initGivingComponent() {
  try {

    // get active campaign
    const { id, ...donationCampaign } = await callServer("/api/getActiveDonationCampaign");

    // "id" of the campaign should not be returned to the frontend, but should be preserved in the session in order to make donation afterwards
    
    if(donationCampaign) {

      // Create the configuration object
      const donationConfig = {
        amounts: donationCampaign.amounts,
        backgroundUrl: donationCampaign.bannerUrl,
        description: donationCampaign.nonprofitDescription,
        logoUrl: donationCampaign.logoUrl,
        name: donationCampaign.causeName,
        url: donationCampaign.nonprofitUrl,
        disclaimerMessage: {
             message: "By donating you agree to the %{linkText}",
             linkText: "terms and conditions",
             link: donationCampaign.termsAndConditionsUrl,
        },
        showCancelButton: true,
        onDonate: handleOnDonate,
        onCancel: handleOnCancel
   };

      const checkout = await new AdyenCheckout(
        {
          clientKey,
          environment: "test",
        }
      );

      const donation = checkout.create('donation', donationConfig).mount('#donation-container');
    }

  } catch (error) {
    console.error(error);
    alert("Error occurred. Look at console for details");
  }
}

// onDonate handler
async function handleOnDonate(state, component) {
  console.log("handleOnDonate")

  if (state.isValid) {
    // make donation (passing the amount chosen by the shopper)
    const donation = await callServer("/api/donations", state.data);

    switch (donation.status) {
      case "completed":
        window.location.href = "/result/donated";
        break;
      default:
        window.location.href = "/result/error";
        break;
    }
  }
}

// onCancel handler
async function handleOnCancel(state, component) {
  console.log("handleOnCancel")
  // hide component 
  document.getElementById('donation-container').style.display = 'none';
}

// Calls your server endpoints
async function callServer(url, data) {
  const res = await fetch(url, {
    method: "POST",
    body: data ? JSON.stringify(data) : "",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await res.json();
}

initGivingComponent();
