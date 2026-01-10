#!/usr/bin/env node

/**
 * Setup Stripe webhook endpoint using Stripe API
 * This script creates a webhook endpoint and configures it for credit purchases
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Direct Stripe initialization (similar to lib/stripe.ts)
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }

  const Stripe = require('stripe');
  return new Stripe(secretKey, {
    apiVersion: '2024-04-10',
  });
};

async function setupWebhook() {
  console.log('🚀 Setting up Stripe webhook endpoint...');

  // Check required environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('❌ NEXT_PUBLIC_APP_URL not found in environment variables');
    process.exit(1);
  }

  const stripe = getStripe();
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/credits/webhook`;

  console.log(`📍 Webhook URL: ${webhookUrl}`);

  try {
    // Check if webhook already exists
    console.log('🔍 Checking for existing webhooks...');
    const existingWebhooks = await stripe.webhookEndpoints.list();
    const existingWebhook = existingWebhooks.data.find(wh => wh.url === webhookUrl);

    if (existingWebhook) {
      console.log('✅ Webhook endpoint already exists');
      console.log(`   ID: ${existingWebhook.id}`);
      console.log(`   Status: ${existingWebhook.status}`);
      console.log(`   Secret: ${existingWebhook.secret ? 'Configured' : 'Missing'}`);

      // Update the webhook if it exists but check if events need updating
      const requiredEvents = [
        'checkout.session.completed',
        'checkout.session.async_payment_succeeded',
        'checkout.session.async_payment_failed',
        'invoice.payment_succeeded',
        'invoice.payment_failed'
      ];

      const currentEvents = existingWebhook.enabled_events || [];
      const missingEvents = requiredEvents.filter(event => !currentEvents.includes(event));

      if (missingEvents.length > 0) {
        console.log('🔄 Updating webhook events...');
        await stripe.webhookEndpoints.update(existingWebhook.id, {
          enabled_events: requiredEvents
        });
        console.log('✅ Webhook events updated');
      }

      // Update environment variable if secret is available
      if (existingWebhook.secret) {
        updateEnvFile(existingWebhook.secret);
      }

      return {
        id: existingWebhook.id,
        secret: existingWebhook.secret,
        url: existingWebhook.url
      };
    }

    // Create new webhook endpoint
    console.log('📝 Creating new webhook endpoint...');
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'checkout.session.completed',
        'checkout.session.async_payment_succeeded',
        'checkout.session.async_payment_failed',
        'invoice.payment_succeeded',
        'invoice.payment_failed'
      ],
      description: 'Webhook for landing page generator credit purchases',
      metadata: {
        application: 'simpler-landing-generator',
        purpose: 'credit-purchase-webhook'
      }
    });

    console.log('✅ Webhook endpoint created successfully!');
    console.log(`   ID: ${webhookEndpoint.id}`);
    console.log(`   URL: ${webhookEndpoint.url}`);
    console.log(`   Status: ${webhookEndpoint.status}`);

    // Update environment variables
    if (webhookEndpoint.secret) {
      updateEnvFile(webhookEndpoint.secret);
    }

    return {
      id: webhookEndpoint.id,
      secret: webhookEndpoint.secret,
      url: webhookEndpoint.url
    };

  } catch (error) {
    console.error('❌ Failed to setup webhook:', error.message);
    if (error.response) {
      console.error('   Stripe API Error:', error.response.data);
    }
    process.exit(1);
  }
}

function updateEnvFile(webhookSecret) {
  const envPath = path.join(__dirname, '..', '.env.local');

  try {
    let envContent = '';

    // Read existing env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Check if STRIPE_WEBHOOK_SECRET already exists
    const secretRegex = /^STRIPE_WEBHOOK_SECRET=.*/m;
    const newSecretLine = `STRIPE_WEBHOOK_SECRET=${webhookSecret}`;

    if (secretRegex.test(envContent)) {
      // Update existing line
      envContent = envContent.replace(secretRegex, newSecretLine);
      console.log('🔄 Updated existing STRIPE_WEBHOOK_SECRET in .env.local');
    } else {
      // Add new line
      if (envContent && !envContent.endsWith('\n')) {
        envContent += '\n';
      }
      envContent += `\n${newSecretLine}\n`;
      console.log('✅ Added STRIPE_WEBHOOK_SECRET to .env.local');
    }

    // Write back to file
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log('💾 Environment file updated');

  } catch (error) {
    console.error('❌ Failed to update .env.local file:', error.message);
    console.log('   Please manually add this line to your .env.local file:');
    console.log(`   STRIPE_WEBHOOK_SECRET=${webhookSecret}`);
  }
}

async function testWebhook() {
  console.log('\n🧪 Testing webhook endpoint...');

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/credits/webhook`;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'webhook-test' })
    });

    if (response.status === 400) {
      const data = await response.json();
      if (data.error === 'No signature') {
        console.log('✅ Webhook endpoint is responding correctly (signature validation working)');
        return true;
      }
    }

    console.log('⚠️  Unexpected webhook response:', response.status);
    return false;

  } catch (error) {
    console.log('❌ Webhook endpoint test failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  try {
    const webhook = await setupWebhook();

    console.log('\n🎉 Webhook setup completed!');
    console.log(`   Webhook ID: ${webhook.id}`);
    console.log(`   Webhook URL: ${webhook.url}`);
    console.log(`   Secret: ${webhook.secret ? '✅ Configured' : '❌ Missing'}`);

    // Test the webhook
    const testPassed = await testWebhook();

    console.log('\n📋 Next steps:');
    if (testPassed) {
      console.log('✅ Webhook is working correctly');
      console.log('✅ Ready to process Stripe payments');
    } else {
      console.log('⚠️  Webhook may need manual testing');
    }

    console.log('\n💡 To test webhook delivery:');
    console.log('   1. Start your dev server: npm run dev');
    console.log('   2. Use Stripe CLI: stripe listen --forward-to localhost:3000/api/credits/webhook');
    console.log('   3. Trigger test event: stripe trigger checkout.session.completed');

  } catch (error) {
    console.error('❌ Webhook setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupWebhook, updateEnvFile };