/**
 * Utility functions for formatting values across the pharmacy frontend.
 */

/**
 * Formats a monetary amount into Sri Lankan Rupees format: "RS 3420.00"
 * - Always uses "RS " prefix with a single space
 * - Always shows exactly 2 decimal places
 *
 * @param {number|string|null|undefined} amount
 * @returns {string} Formatted currency string (e.g. "RS 3420.00")
 */
export function formatCurrency(amount) {
  const num = Number(amount);
  if (isNaN(num)) {
    return 'RS 0.00';
  }
  return `RS ${num.toFixed(2)}`;
}

export default {
  formatCurrency,
};
