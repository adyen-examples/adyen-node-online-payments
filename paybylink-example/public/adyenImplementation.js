// Creates new payment link
async function createPaymentLink() {
  try {
      const amount = document.getElementById('amount').value;
      const reference = document.getElementById('reference').value;
      const isreusable = document.getElementById('isreusable').checked;
      if (!amount || !reference) {
          return;
      }
      const linksResponse = await sendPostRequest("/api/links", { Amount: amount, Reference: reference, IsReusable: isreusable});
      console.info("paymentLinkId: " + linksResponse);
      window.location.reload();
  } catch (error) {
      console.error(error);
      alert("Error occurred. Look at console for details");
  }
}

// Sends POST request
async function sendPostRequest(url, data) {
  const res = await fetch(url, {
      method: "POST",
      body: data ? JSON.stringify(data) : "",
      headers: {
          "Content-Type": "application/json",
      },
  });

  return await res.json();
}