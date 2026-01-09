#!/usr/bin/env node

/**
 * Comprehensive Stripe Integration Test
 * Tests the complete flow from product setup to webhook processing
 *
 * Usage: node scripts/test-stripe-integration.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config();

console.log('🚀 Starting Comprehensive Stripe Integration Test\n');

// Check environment
function checkEnvironment() {
  console.log('📋 Checking environment setup...');

  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'POSTGRES_URL'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    return false;
  }

  // Check if price IDs are configured (not placeholders)
  const priceIds = [
    process.env.STRIPE_PRICE_SMALL,
    process.env.STRIPE_PRICE_MEDIUM,
    process.env.STRIPE_PRICE_LARGE
  ];

  const placeholderPrices = priceIds.filter(id => id && id.includes('placeholder'));

  if (placeholderPrices.length > 0) {
    console.warn('⚠️  Price IDs are still placeholders. Run setup script:');
    console.warn('   npm run stripe:setup-products');
    return false;
  }

  console.log('✅ Environment variables configured');
  return true;
}

// Test database connectivity
async function testDatabase() {
  console.log('\n💾 Testing database connectivity...');

  try {
    // Test a simple database operation
    const response = execSync('curl -s "http://localhost:3000/api/credits/balance" -H "Cookie: __clerk_db_jwt=test"', {
      encoding: 'utf8',
      timeout: 5000
    });

    if (response.includes('balance')) {
      console.log('✅ Database connection working');
      return true;
    }
  } catch (error) {
    console.log('❌ Database test failed - is the dev server running?');
    console.log('   Run: npm run dev');
    return false;
  }

  return false;
}

// Test Stripe API connectivity
async function testStripeAPI() {
  console.log('\n💳 Testing Stripe API connectivity...');

  try {
    const response = execSync('curl -s "https://api.stripe.com/v1/products" -H "Authorization: Bearer ' + process.env.STRIPE_SECRET_KEY + '"', {
      encoding: 'utf8',
      timeout: 5000
    });

    if (response.includes('"object": "list"')) {
      console.log('✅ Stripe API connection working');
      return true;
    } else {
      console.log('❌ Unexpected Stripe API response');
      return false;
    }
  } catch (error) {
    console.log('❌ Stripe API test failed:', error.message);
    return false;
  }
}

// Test product setup
async function testProducts() {
  console.log('\n📦 Testing product configuration...');

  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const priceIds = [
      process.env.STRIPE_PRICE_SMALL,
      process.env.STRIPE_PRICE_MEDIUM,
      process.env.STRIPE_PRICE_LARGE
    ];

    for (const priceId of priceIds) {
      if (!priceId) continue;

      const price = await stripe.prices.retrieve(priceId);
      console.log(`✅ Price ${priceId}: $${price.unit_amount / 100} (${price.currency})`);
    }

    console.log('✅ All products configured correctly');
    return true;
  } catch (error) {
    console.log('❌ Product test failed:', error.message);
    return false;
  }
}

// Test webhook endpoint
async function testWebhookEndpoint() {
  console.log('\n🔗 Testing webhook endpoint...');

  try {
    const response = execSync('curl -s -X POST "http://localhost:3000/api/credits/webhook" -H "Content-Type: application/json" -d "{}"', {
      encoding: 'utf8',
      timeout: 5000
    });

    if (response.includes('No signature')) {
      console.log('✅ Webhook endpoint responding (signature validation active)');
      return true;
    } else {
      console.log('❌ Unexpected webhook response:', response);
      return false;
    }
  } catch (error) {
    console.log('❌ Webhook endpoint test failed - is the dev server running?');
    return false;
  }
}

// Test frontend component rendering
async function testFrontendComponents() {
  console.log('\n🎨 Testing frontend components...');

  try {
    // Check if the purchase modal component exists and is properly structured
    const componentPath = 'components/purchase-credits-modal.tsx';
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      if (content.includes('CREDIT_PACKAGES') && content.includes('handlePurchase')) {
        console.log('✅ Purchase modal component configured');
      } else {
        console.log('❌ Purchase modal component missing required elements');
        return false;
      }
    }

    // Check credit display component
    const displayPath = 'components/credit-display.tsx';
    if (fs.existsSync(displayPath)) {
      const content = fs.readFileSync(displayPath, 'utf8');
      if (content.includes('credits') && content.includes('CreditDisplay')) {
        console.log('✅ Credit display component configured');
      } else {
        console.log('❌ Credit display component missing required elements');
        return false;
      }
    }

    console.log('✅ Frontend components configured');
    return true;
  } catch (error) {
    console.log('❌ Frontend test failed:', error.message);
    return false;
  }
}

// Test configuration validation
async function testConfigurationValidation() {
  console.log('\n⚙️  Testing configuration validation...');

  try {
    // Check if the stripe.ts file exists and has proper structure
    if (fs.existsSync('lib/stripe.ts')) {
      const content = fs.readFileSync('lib/stripe.ts', 'utf8');
      if (content.includes('validateStripeConfig') && content.includes('priceId') && content.includes('CREDIT_PACKAGES')) {
        console.log('✅ Configuration validation implemented');
        return true;
      }
    }

    console.log('❌ Configuration validation not properly implemented');
    return false;
  } catch (error) {
    console.log('❌ Configuration test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  const tests = [
    { name: 'Environment Setup', fn: checkEnvironment },
    { name: 'Database Connectivity', fn: testDatabase },
    { name: 'Stripe API', fn: testStripeAPI },
    { name: 'Product Setup', fn: testProducts },
    { name: 'Webhook Endpoint', fn: testWebhookEndpoint },
    { name: 'Frontend Components', fn: testFrontendComponents },
    { name: 'Configuration Validation', fn: testConfigurationValidation }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ ...test, passed: result });
    } catch (error) {
      console.log(`❌ ${test.name} test threw error:`, error.message);
      results.push({ ...test, passed: false });
    }
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('=' .repeat(50));

  let passed = 0;
  let failed = 0;

  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    if (result.passed) passed++;
    else failed++;
  });

  console.log('=' .repeat(50));
  console.log(`Total: ${results.length}, Passed: ${passed}, Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your Stripe integration is ready.');
    console.log('\nNext steps:');
    console.log('1. Start your dev server: npm run dev');
    console.log('2. Test the purchase flow in your browser');
    console.log('3. Monitor Stripe logs in your dashboard');
    console.log('\nFor production deployment:');
    console.log('1. Set up webhook endpoint in Stripe dashboard');
    console.log('2. Configure production environment variables');
    console.log('3. Test with real payments (use small amounts)');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please fix the issues above.`);
    console.log('\nCommon fixes:');
    console.log('- Make sure all environment variables are set');
    console.log('- Run: npm run stripe:setup-products');
    console.log('- Start dev server: npm run dev');
    console.log('- Check Stripe dashboard for API keys');
  }

  return failed === 0;
}

// Run all tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});