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
export const CREDIT_PACKAGES = {
  small: {
    credits: 5,
    price: 500, // $5.00 in cents
    name: '5 Credits',
    description: 'Perfect for testing and small projects'
  },
  medium: {
    credits: 15,
    price: 1200, // $12.00 in cents
    name: '15 Credits',
    description: 'Great for multiple landing pages'
  },
  large: {
    credits: 50,
    price: 3000, // $30.00 in cents
    name: '50 Credits',
    description: 'Ideal for agencies and heavy users'
  }
} as const;

export type CreditPackage = keyof typeof CREDIT_PACKAGES;
