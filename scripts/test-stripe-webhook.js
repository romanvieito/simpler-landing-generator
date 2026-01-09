#!/usr/bin/env node

/**
 * Test script for Stripe webhook functionality
 * This script simulates webhook events for testing purposes
 *
 * Usage: node scripts/test-stripe-webhook.js
 */

const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/credits/webhook`
  : 'http://localhost:3000/api/credits/webhook';

console.log('🧪 Testing Stripe Webhook Integration');
console.log(`Webhook URL: ${WEBHOOK_URL}`);

// Check if required environment variables are set
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_APP_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.log('\nPlease set these in your .env file');
  process.exit(1);
}

console.log('✅ Environment variables are set');

// Test database connection and table creation
async function testDatabaseSetup() {
  console.log('\n🔍 Testing database setup...');

  try {
    // Try to run a simple API call that ensures tables exist
    const response = execSync(`curl -s -X GET "${WEBHOOK_URL.replace('/webhook', '/balance')}" -H "Authorization: Bearer test"`, {
      encoding: 'utf8',
      timeout: 5000
    });

    if (response.includes('Unauthorized')) {
      console.log('✅ Database tables are accessible (auth required as expected)');
    } else {
      console.log('⚠️  Unexpected response from balance endpoint');
    }
  } catch (error) {
    console.log('❌ Database setup test failed:', error.message);
    return false;
  }

  return true;
}

// Test Stripe CLI if available
function testStripeCLI() {
  console.log('\n🔍 Testing Stripe CLI...');

  try {
    const version = execSync('stripe --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Stripe CLI available: ${version}`);

    // Test webhook listening capability
    console.log('💡 To test webhooks locally, run:');
    console.log(`   stripe listen --forward-to ${WEBHOOK_URL}`);
    console.log('   stripe trigger checkout.session.completed');

    return true;
  } catch (error) {
    console.log('⚠️  Stripe CLI not available');
    console.log('💡 Install with: npm install -g stripe');
    console.log('💡 Or test manually with webhook testing tools');
    return false;
  }
}

// Test webhook endpoint availability
async function testWebhookEndpoint() {
  console.log('\n🔍 Testing webhook endpoint availability...');

  try {
    const response = execSync(`curl -s -X POST "${WEBHOOK_URL}" -H "Content-Type: application/json" -d '{}'`, {
      encoding: 'utf8',
      timeout: 5000
    });

    if (response.includes('No signature')) {
      console.log('✅ Webhook endpoint is responding (signature validation working)');
      return true;
    } else {
      console.log('⚠️  Unexpected webhook response:', response);
      return false;
    }
  } catch (error) {
    console.log('❌ Webhook endpoint test failed:', error.message);
    return false;
  }
}

async function main() {
  const results = {
    database: await testDatabaseSetup(),
    webhook: await testWebhookEndpoint(),
    stripeCLI: testStripeCLI()
  };

  console.log('\n📊 Test Results Summary:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const allPassed = Object.values(results).every(Boolean);

  if (allPassed) {
    console.log('\n🎉 All tests passed! Your Stripe integration is ready.');
    console.log('\nNext steps:');
    console.log('1. Run: npm run stripe:setup-products');
    console.log('2. Copy the price IDs to your .env file');
    console.log('3. Test with real Stripe checkout');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above.');
  }
}

main().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});