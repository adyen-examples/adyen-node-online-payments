/**
 * Payment Service
 * Handles payment-related business logic and status tracking
 */

const { v4: uuidv4 } = require('uuid');

// In-memory storage for payment statuses (in production, use a database)
const paymentStatuses = new Map();

/**
 * Generate a unique order reference
 */
const generateOrderRef = () => {
  return uuidv4();
};

/**
 * Store payment status
 */
const storePaymentStatus = (orderRef, status) => {
  paymentStatuses.set(orderRef, {
    status,
    timestamp: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  console.log(`Payment status stored for ${orderRef}: ${status}`);
};

/**
 * Get payment status
 */
const getPaymentStatus = (orderRef) => {
  const status = paymentStatuses.get(orderRef);
  if (!status) {
    return null;
  }
  
  return {
    orderRef,
    ...status
  };
};

/**
 * Update payment status from webhook
 */
const updatePaymentStatusFromWebhook = (merchantReference, eventCode, success) => {
  if (!merchantReference) {
    console.warn('No merchant reference provided in webhook');
    return;
  }

  let status;
  switch (eventCode) {
    case 'AUTHORISATION':
      status = success ? 'Authorised' : 'Refused';
      break;
    case 'CAPTURE':
      status = success ? 'Captured' : 'Capture Failed';
      break;
    case 'REFUND':
      status = success ? 'Refunded' : 'Refund Failed';
      break;
    case 'CANCELLATION':
      status = 'Cancelled';
      break;
    default:
      console.log(`Unknown event code: ${eventCode}`);
      return;
  }

  storePaymentStatus(merchantReference, status);
  console.log(`Payment status updated from webhook: ${merchantReference} -> ${status}`);
};

/**
 * Get all payment statuses (for debugging)
 */
const getAllPaymentStatuses = () => {
  const statuses = {};
  for (const [orderRef, status] of paymentStatuses.entries()) {
    statuses[orderRef] = status;
  }
  return statuses;
};

/**
 * Clear payment statuses (for testing)
 */
const clearPaymentStatuses = () => {
  paymentStatuses.clear();
  console.log('All payment statuses cleared');
};

module.exports = {
  generateOrderRef,
  storePaymentStatus,
  getPaymentStatus,
  updatePaymentStatusFromWebhook,
  getAllPaymentStatuses,
  clearPaymentStatuses
};
