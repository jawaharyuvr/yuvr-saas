export interface TaxRate {
  region: string;
  rate: number;
  name: string;
}

export const TAX_RATES: Record<string, TaxRate> = {
  'IN': { region: 'India', rate: 18, name: 'GST' },
  'EU': { region: 'Europe', rate: 20, name: 'VAT' },
  'UK': { region: 'United Kingdom', rate: 20, name: 'VAT' },
  'US': { region: 'United States', rate: 0, name: 'Sales Tax' },
  'DEFAULT': { region: 'Other', rate: 0, name: 'Tax' }
};

export const getTaxRateForRegion = (region: string = 'DEFAULT'): TaxRate => {
  const normalizedRegion = region.toUpperCase();
  return TAX_RATES[normalizedRegion] || TAX_RATES['DEFAULT'];
};

export const calculateTax = (amount: number, rate: number) => {
  return amount * (rate / 100);
};
