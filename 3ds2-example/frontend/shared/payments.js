export const getPaymentMethods = async () => {
  console.log("Do /paymentMethods GET request");
  const response = await fetch("/api/paymentMethods");
  return await response.json();
};

export const postDoPayment = async (data, { url, flow }) => {
  const paymentsUrl = `/api/payments/${flow}`;

  console.log(`Do ${paymentsUrl} POST request with: ${data}`);

  const requestBody = { data, url };
  const response = await fetch(paymentsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  return await response.json();
};

export const postDoPaymentDetails = async (data) => {
  console.log(`Do /payments/details POST request with: ${data}`);
  const response = await fetch("/api/paymentDetails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  });
  return await response.json();
};

export const postDoSessions = async (data) => {
  console.log("Do /sessions request with: ", data);
  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  });
  return await response.json();
};
