/**
 * Temporary overrides for known simulator issues for specific payment methods.
 *
 * Keep these utilities isolated so they can be removed once sandboxes are fixed.
 */

/**
 * Returns true if an initial Cancelled should be treated as Pending and routed to pending page.
 * Applies to MobilePay simulator behavior. We also infer MobilePay in Drop-in when country is DK.
 */
function shouldRouteCancelledToPending(paymentMethod, selectedCountry) {
  const method = String(paymentMethod || '').toLowerCase();
  const country = String(selectedCountry || '').toUpperCase();

  if (method === 'mobilepay') return true;
  // Drop-in: method may be 'default' or unknown; use country heuristic for DK
  if (country === 'DK') return true;

  return false;
}

module.exports = {
  shouldRouteCancelledToPending,
};


