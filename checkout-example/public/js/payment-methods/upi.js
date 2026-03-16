const clientKey = document.getElementById("clientKey").innerHTML;
const { AdyenCheckout, UPI } = window.AdyenWeb;

// Function to create AdyenCheckout instance
async function createAdyenCheckout(session) {
  const configuration = window.PaymentHandlers?.createPaymentConfiguration
    ? window.PaymentHandlers.createPaymentConfiguration(session, {
        clientKey,
        environment: 'test',
        amount: session.amount || {
          value: 10000,
          currency: 'INR'
        },
        locale: 'en_US',
        countryCode: session.countryCode || 'IN',
        showPayButton: true
      })
    : {
        session: session,
        clientKey,
        environment: 'test',
        amount: session.amount || {
          value: 10000,
          currency: 'INR'
        },
        locale: 'en_US',
        countryCode: session.countryCode || 'IN',
        showPayButton: true,
        onPaymentCompleted: (result, component) => {
          console.info('onPaymentCompleted', result, component);
          const resultCode = result?.resultCode;
          if (resultCode === 'Authorised') {
            window.location.href = '/result/success';
          } else if (resultCode === 'Pending' || resultCode === 'Received') {
            window.location.href = '/result/pending';
          } else if (resultCode === 'Refused' || resultCode === 'Cancelled') {
            window.location.href = '/result/failed';
          } else {
            window.location.href = '/result/error';
          }
        },
        onPaymentFailed: (result, component) => {
          console.info('onPaymentFailed', result, component);
          window.location.href = '/result/failed';
        },
        onError: (error, component) => {
          console.error('onError', error.name, error.message, error.stack, component);
          window.location.href = '/result/error';
        }
      };

  return AdyenCheckout(configuration);
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

    const containerSelector = document.getElementById('upi-container')
      ? '#upi-container'
      : '#component-container';

    const upiComponent = new UPI(checkout, {
      // The configuration object for UPI that you created.
    }).mount(containerSelector);

  } catch (error) {
    console.error(error);
    alert("Error occurred. Look at console for details");
  }
}

startCheckout();
