import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey) {
  if (typeof window === 'undefined') {
    console.warn('STRIPE_SECRET_KEY is missing. Stripe features will be disabled.');
  }
}

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' as any,
      appInfo: {
        name: "Yuvr's",
        version: '0.1.0',
      },
    })
  : null;
