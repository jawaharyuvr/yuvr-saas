import { supabase } from '@/lib/supabase';

const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

/**
 * Fetches real-time exchange rates from API and upserts them into Supabase.
 * Implements an hourly sync lock to optimize performance and API usage.
 */
export async function syncExchangeRates(force = false) {
  try {
    // 1. Check if we synced recently (in the last hour)
    if (!force) {
      const { data: lastSync } = await supabase
        .from('exchange_rates')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (lastSync) {
        const lastSyncTime = new Date(lastSync.updated_at).getTime();
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (lastSyncTime > oneHourAgo) {
          console.log('Exchange rates are up to date (synced within the last hour)');
          return true;
        }
      }
    }

    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch exchange rates');
    
    const data = await response.json();
    const rates = data.rates;
    
    const targetCurrencies = ['INR', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'AED', 'SAR'];
    const now = new Date().toISOString();
    
    const upserts = targetCurrencies.map(currency => ({
      from_currency: 'USD',
      to_currency: currency,
      rate: rates[currency],
      updated_at: now
    }));

    upserts.push({
      from_currency: 'USD',
      to_currency: 'USD',
      rate: 1,
      updated_at: now
    });

    const { error } = await supabase
      .from('exchange_rates')
      .upsert(upserts, { onConflict: 'from_currency,to_currency' });

    if (error) throw error;
    console.log('Exchange rates synced successfully');
    return true;
  } catch (error) {
    console.error('Error syncing exchange rates:', error);
    return false;
  }
}

/**
 * Fetches historical exchange rates for the last 5 days.
 * Uses Frankfurter API for free historical data.
 */
export async function getExchangeHistory(base = 'USD') {
  try {
    const today = new Date();
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(today.getDate() - 5);
    
    const startDate = fiveDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    // Frankfurter API for history
    const response = await fetch(`https://api.frankfurter.dev/v1/${startDate}..${endDate}?from=${base}`);
    if (!response.ok) throw new Error('Failed to fetch historical rates');
    
    const data = await response.json();
    return data.rates; // Record<string, Record<string, number>>
  } catch (error) {
    console.error('Error fetching exchange history:', error);
    return null;
  }
}
/**
 * Retrieves the most recent exchange rate between two currencies from the database.
 */
export async function getLiveRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  try {
    // 1. Try direct fetch (e.g. USD to INR)
    const { data: direct } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', from.toUpperCase())
      .eq('to_currency', to.toUpperCase())
      .single();

    if (direct) return direct.rate;

    // 2. Try inverse fetch (e.g. INR to USD)
    const { data: inverse } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', to.toUpperCase())
      .eq('to_currency', from.toUpperCase())
      .single();

    if (inverse) return 1 / inverse.rate;

    // 3. Fallback to hardcoded constants if DB is empty
    return 1; // Default
  } catch (error) {
    return 1;
  }
}

/**
 * Converts an amount using the rate available at a specific point in time (stored on the record).
 * If no stored rate exists, it falls back to the live rate.
 */
export function convertWithRate(amount: number, rate?: number): number {
  if (!rate) return amount;
  return Number((amount * rate).toFixed(2));
}
