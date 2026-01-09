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
    priceId: 'price_1SnmK2HDPeQP87xvX5QffqT9', // 5 Credits package
    name: '5 Credits',
    description: 'Perfect for testing and small projects'
  },
  medium: {
    credits: 15,
    price: 1200, // $12.00 in cents
    priceId: 'price_1SnmK3HDPeQP87xvGdRDr2Wx', // 15 Credits package
    name: '15 Credits',
    description: 'Great for multiple landing pages'
  },
  large: {
    credits: 50,
    price: 3000, // $30.00 in cents
    priceId: 'price_1SnmK4HDPeQP87xvQI2Ruk6a', // 50 Credits package
    name: '50 Credits',
    description: 'Ideal for agencies and heavy users'
  }
} as const;

export type CreditPackage = keyof typeof CREDIT_PACKAGES;

// Validate that Stripe is properly configured
export const validateStripeConfig = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }

  // In production, ensure we have a webhook secret
  if (process.env.NODE_ENV === 'production' && !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required in production');
  }
};
