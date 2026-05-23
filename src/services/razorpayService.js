export const initializeRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const initiateCheckout = async (amount, onSuccess, onError) => {
  const isLoaded = await initializeRazorpay();
  
  if (!isLoaded) {
    alert("Razorpay SDK failed to load. Are you online?");
    return;
  }

  // In a real app, you would create an order on your backend here and get the order ID.
  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_placeholder', // Enter the Key ID generated from the Dashboard
    amount: amount * 100, // Amount is in currency subunits. Default currency is INR.
    currency: 'INR',
    name: 'Epicurean AI',
    description: 'Premium Culinary Subscription',
    image: '/pwa-192x192.png',
    handler: function (response) {
      if (onSuccess) {
        onSuccess(response);
      }
    },
    prefill: {
      name: 'User Name',
      email: 'user@example.com',
      contact: '9999999999'
    },
    theme: {
      color: '#755b00' // primary color
    }
  };

  const paymentObject = new window.Razorpay(options);
  paymentObject.on('payment.failed', function (response) {
    if (onError) {
      onError(response.error);
    } else {
      alert("Payment failed: " + response.error.description);
    }
  });
  
  paymentObject.open();
};
