// lib/stripe.ts
import Stripe from 'stripe';

export const getStripe = (): Stripe => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }

  return new Stripe(secretKey, {
    apiVersion: '2024-04-10',
  });
};

// Credit packages configuration
// IMPORTANT: Replace these price IDs with actual Stripe price IDs after running setup-stripe-products.js
export const CREDIT_PACKAGES = {
  small: {
    credits: 5,
    price: 500, // $5.00 in cents
    priceId: process.env.STRIPE_PRICE_SMALL || 'price_small_placeholder', // Replace with actual price ID
    name: '5 Credits',
    description: 'Perfect for testing and small projects'
  },
  medium: {
    credits: 15,
    price: 1200, // $12.00 in cents
    priceId: process.env.STRIPE_PRICE_MEDIUM || 'price_medium_placeholder', // Replace with actual price ID
    name: '15 Credits',
    description: 'Great for multiple landing pages'
  },
  large: {
    credits: 50,
    price: 3000, // $30.00 in cents
    priceId: process.env.STRIPE_PRICE_LARGE || 'price_large_placeholder', // Replace with actual price ID
    name: '50 Credits',
    description: 'Ideal for agencies and heavy users'
  }
} as const;

export type CreditPackage = keyof typeof CREDIT_PACKAGES;

// Validate that price IDs are configured
export const validateStripeConfig = () => {
  // In development, allow placeholder values for testing UI
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  const missingPrices = Object.entries(CREDIT_PACKAGES)
    .filter(([_, pkg]) => pkg.priceId.includes('placeholder'))
    .map(([key]) => key);

  if (missingPrices.length > 0) {
    throw new Error(
      `Missing Stripe price IDs for packages: ${missingPrices.join(', ')}. ` +
      'Please run the setup script and update environment variables.'
    );
  }
};
