export const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  USD: {
    INR: 83.50,
    EUR: 0.92,
    GBP: 0.79,
    USD: 1
  },
  INR: {
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    INR: 1
  },
  EUR: {
    USD: 1.09,
    INR: 90.75,
    GBP: 0.86,
    EUR: 1
  },
  GBP: {
    USD: 1.27,
    INR: 105.80,
    EUR: 1.16,
    GBP: 1
  }
};

/**
 * Converts an amount from one currency to another using high-precision math.
 * @param amount The numerical value to convert.
 * @param from The source currency code (e.g., 'USD').
 * @param to The target currency code (e.g., 'INR').
 * @returns The converted amount.
 */
export function convertCurrency(amount: number, from: string = 'USD', to: string = 'USD'): number {
  const source = from.toUpperCase();
  const target = to.toUpperCase();

  if (source === target) return amount;

  const rate = EXCHANGE_RATES[source]?.[target];
  
  if (!rate) {
    console.warn(`Exchange rate from ${source} to ${target} not found. Returning original amount.`);
    return amount;
  }

  return Number((amount * rate).toFixed(2));
}

/**
 * Lists all supported currency codes.
 */
export const SUPPORTED_CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SAR', 'JPY'];

/**
 * Gets a currency symbol for a code.
 */
export function getCurrencySymbol(code: string): string {
  switch (code.toUpperCase()) {
    case 'USD': return '$';
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'AED': return 'د.إ';
    case 'SAR': return '﷼';
    case 'JPY': return '¥';
    default: return code;
  }
}
