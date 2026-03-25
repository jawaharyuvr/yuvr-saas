export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', country: 'US' },
  { code: 'EUR', symbol: '€', name: 'Euro', country: 'EU' },
  { code: 'GBP', symbol: '£', name: 'British Pound', country: 'GB' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'IN' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'JP' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', country: 'CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'AU' },
];

export const CONVERSION_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.0,
  JPY: 150.0,
  CAD: 1.35,
  AUD: 1.52,
};

export const convertAmount = (amount: number, from: string, to: string) => {
  if (from === to) return amount;
  const inUSD = amount / (CONVERSION_RATES[from] || 1);
  return inUSD * (CONVERSION_RATES[to] || 1);
};
