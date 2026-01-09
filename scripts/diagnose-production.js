#!/usr/bin/env node

/**
 * Production Diagnostics Script
 * Tests what might be failing in production environment
 */

console.log('🔍 Production Diagnostics Starting...\n');

async function runDiagnostics() {
  // Test 1: Environment Variables
  console.log('📋 Testing Environment Variables...');
  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_APP_URL',
    'POSTGRES_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'NODE_ENV'
  ];

  let envIssues = [];
  required.forEach(key => {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      envIssues.push(key);
      console.log(`❌ ${key}: MISSING`);
    } else {
      console.log(`✅ ${key}: configured`);
    }
  });

  if (envIssues.length > 0) {
    console.log(`\n⚠️  Missing environment variables: ${envIssues.join(', ')}`);
    console.log('This is likely the cause of the 500 error!\n');
  }

  // Test 2: Stripe API Connection
  console.log('💳 Testing Stripe API Connection...');
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Test basic API call
    const balance = await stripe.balance.retrieve();
    console.log('✅ Stripe API: Connected');

    // Test products
    const products = await stripe.products.list({ limit: 5 });
    console.log(`✅ Products found: ${products.data.length}`);

    // Test our specific price IDs
    const priceIds = [
      'price_1SnmK2HDPeQP87xvX5QffqT9', // 5 credits
      'price_1SnmK3HDPeQP87xvGdRDr2Wx', // 15 credits
      'price_1SnmK4HDPeQP87xvQI2Ruk6a'  // 50 credits
    ];

    for (const priceId of priceIds) {
      try {
        const price = await stripe.prices.retrieve(priceId);
        console.log(`✅ Price ${priceId}: ${price.unit_amount / 100} USD`);
      } catch (error) {
        console.log(`❌ Price ${priceId}: NOT FOUND - ${error.message}`);
      }
    }

  } catch (error) {
    console.log(`❌ Stripe API Error: ${error.message}`);
  }

  // Test 3: Database Connection
  console.log('\n💾 Testing Database Connection...');
  try {
    const { sql } = require('@vercel/postgres');
    await sql`SELECT 1 as test`;
    console.log('✅ Database: Connected');
  } catch (error) {
    console.log(`❌ Database Error: ${error.message}`);
  }

  // Test 4: Clerk Configuration
  console.log('\n🔐 Testing Clerk Configuration...');
  try {
    const { auth } = require('@clerk/nextjs/server');

    // In production, we can't really test auth without a request
    // But we can check if the keys are configured
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    const clerkPublishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    if (clerkSecret && clerkPublishable) {
      console.log('✅ Clerk: Keys configured');
    } else {
      console.log('❌ Clerk: Keys missing');
    }
  } catch (error) {
    console.log(`❌ Clerk Error: ${error.message}`);
  }

  console.log('\n🎯 Diagnostics Complete!');
  console.log('\n💡 Common Production Issues:');
  console.log('1. Environment variables not set in Vercel dashboard');
  console.log('2. Database connection issues');
  console.log('3. Stripe API key issues');
  console.log('4. Clerk authentication configuration');
  console.log('5. NODE_ENV not set to "production"');
}

runDiagnostics().catch(console.error);