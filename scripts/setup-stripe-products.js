#!/usr/bin/env node

/**
 * Setup script for Stripe products and prices
 * Run this once to create the credit packages in Stripe
 *
 * Usage: node scripts/setup-stripe-products.js
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

// Credit package definitions
const CREDIT_PACKAGES = {
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
};

async function setupStripeProducts() {
  console.log('Setting up Stripe products and prices...');

  try {
    // Create or update products and prices
    for (const [key, pkg] of Object.entries(CREDIT_PACKAGES)) {
      console.log(`\nProcessing ${pkg.name}...`);

      // Check if product already exists
      const existingProducts = await stripe.products.list({
        active: true,
        limit: 100
      });

      let product = existingProducts.data.find(p => p.metadata.packageType === key);

      if (!product) {
        // Create new product
        product = await stripe.products.create({
          name: pkg.name,
          description: pkg.description,
          metadata: {
            packageType: key,
            credits: pkg.credits.toString()
          }
        });
        console.log(`Created product: ${product.id}`);
      } else {
        // Update existing product
        product = await stripe.products.update(product.id, {
          name: pkg.name,
          description: pkg.description,
          metadata: {
            packageType: key,
            credits: pkg.credits.toString()
          }
        });
        console.log(`Updated product: ${product.id}`);
      }

      // Check if price exists for this product
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true
      });

      const existingPrice = existingPrices.data.find(p => p.unit_amount === pkg.price);

      if (!existingPrice) {
        // Create new price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: pkg.price,
          currency: 'usd',
          metadata: {
            packageType: key,
            credits: pkg.credits.toString()
          }
        });
        console.log(`Created price: ${price.id} (${pkg.price / 100} USD)`);
      } else {
        console.log(`Price already exists: ${existingPrice.id} (${pkg.price / 100} USD)`);
      }
    }

    console.log('\n✅ Stripe products and prices setup complete!');
    console.log('\nNext steps:');
    console.log('1. Copy the price IDs from your Stripe dashboard');
    console.log('2. Update lib/stripe.ts with the actual price IDs');
    console.log('3. Test the integration');

  } catch (error) {
    console.error('Error setting up Stripe products:', error);
    process.exit(1);
  }
}

// Run the setup
setupStripeProducts();