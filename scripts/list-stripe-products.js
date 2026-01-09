#!/usr/bin/env node

/**
 * List all Stripe products and prices
 * Shows what's currently configured in your Stripe account
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

async function listStripeProducts() {
  console.log('📦 Listing Stripe Products and Prices...\n');

  try {
    // Get all products
    const products = await stripe.products.list({
      active: true,
      limit: 100
    });

    console.log(`Found ${products.data.length} active products:\n`);

    for (const product of products.data) {
      console.log(`🏷️  Product: ${product.name} (${product.id})`);
      console.log(`   Description: ${product.description || 'No description'}`);
      console.log(`   Metadata:`, product.metadata);

      // Get prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true
      });

      if (prices.data.length > 0) {
        console.log(`   💰 Prices:`);
        for (const price of prices.data) {
          const amount = (price.unit_amount / 100).toFixed(2);
          console.log(`      - ${price.id}: $${amount} ${price.currency.toUpperCase()}`);
        }
      } else {
        console.log(`   ❌ No active prices found`);
      }

      console.log(''); // Empty line between products
    }

    // Also show our configured price IDs
    console.log('🔧 Our configured price IDs in the app:');
    const CREDIT_PACKAGES = {
      small: { priceId: 'price_1SnmK2HDPeQP87xvX5QffqT9', name: '5 Credits', price: 500 },
      medium: { priceId: 'price_1SnmK3HDPeQP87xvGdRDr2Wx', name: '15 Credits', price: 1200 },
      large: { priceId: 'price_1SnmK4HDPeQP87xvQI2Ruk6a', name: '50 Credits', price: 3000 }
    };

    Object.entries(CREDIT_PACKAGES).forEach(([key, pkg]) => {
      console.log(`   ${key}: ${pkg.priceId} - ${pkg.name} ($${pkg.price / 100})`);
    });

  } catch (error) {
    console.error('❌ Error listing products:', error.message);
    process.exit(1);
  }
}

listStripeProducts();