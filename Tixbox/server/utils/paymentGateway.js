// SIMULATED payment gateway so the project runs without real keys.
// To go live, replace processPayment() with Razorpay / Stripe calls (create order -> verify signature),
// keeping the same return shape: { success, transactionId, message }.
const METHODS = ['card', 'upi', 'netbanking', 'wallet'];

const processPayment = async ({ method, amount, details = {} }) => {
  if (!METHODS.includes(method)) return { success: false, message: `Payment method must be one of: ${METHODS.join(', ')}` };

  if (method === 'card') {
    const num = String(details.cardNumber || '').replace(/\s/g, '');
    if (!/^\d{16}$/.test(num)) return { success: false, message: 'Enter a valid 16-digit card number' };
    if (num.endsWith('0000')) return { success: false, message: 'Card declined (test card ending 0000)' };
  }
  if (method === 'upi' && !/^[\w.\-]+@[\w]+$/.test(details.upiId || '')) {
    return { success: false, message: 'Enter a valid UPI id, e.g. name@upi' };
  }

  return { success: true, transactionId: 'TXN' + Date.now() + Math.floor(Math.random() * 1000), amount };
};

module.exports = { processPayment, METHODS };
