#!/usr/bin/env node

/**
 * Setup Clerk webhook endpoint for tracking user authentication events
 * This script creates a webhook endpoint for user.created and session.created events
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

async function setupClerkWebhook() {
  console.log('🚀 Setting up Clerk webhook endpoint for user tracking...');

  // Check required environment variables
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    console.error('❌ CLERK_SECRET_KEY not found in environment variables');
    console.log('   Get your Clerk secret key from: https://dashboard.clerk.com/');
    process.exit(1);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error('❌ NEXT_PUBLIC_APP_URL not found in environment variables');
    process.exit(1);
  }

  // Determine webhook URL
  const isProduction = process.env.NODE_ENV === 'production' || appUrl.includes('vercel.app');
  const webhookUrl = `${appUrl}/api/webhooks/clerk`;

  console.log(`📍 Webhook URL: ${webhookUrl}`);
  console.log(`   Environment: ${isProduction ? 'Production' : 'Development'}`);

  // Validate URL format
  try {
    new URL(webhookUrl);
    console.log('✅ Webhook URL is valid');
  } catch (error) {
    console.error('❌ Invalid webhook URL format:', webhookUrl);
    process.exit(1);
  }

  console.log('\n📋 Manual Setup Instructions for Clerk Webhooks:');
  console.log('='.repeat(60));
  console.log('1. Go to Clerk Dashboard: https://dashboard.clerk.com/');
  console.log('2. Navigate to "Webhooks" in the sidebar');
  console.log('3. Click "Add Endpoint"');
  console.log('4. Enter endpoint URL:');
  console.log(`   ${webhookUrl}`);
  console.log('5. Select these events:');
  console.log('   ✅ user.created - Track new user signups');
  console.log('   ✅ session.created - Track user sign-ins');
  console.log('6. Click "Create"');
  console.log('7. Copy the "Signing Secret" from the webhook details');
  console.log('8. Add it to your environment variables:');
  console.log('   CLERK_WEBHOOK_SECRET=whsec_...');
  console.log('='.repeat(60));

  // Try to automatically set up the webhook if Clerk API is available
  try {
    console.log('\n🔄 Attempting automatic setup via Clerk API...');

    const response = await fetch('https://api.clerk.com/v1/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: ['user.created', 'session.created'],
        description: 'Webhook for tracking user authentication events in Mixpanel',
        enabled: true,
      }),
    });

    if (response.ok) {
      const webhook = await response.json();
      console.log('✅ Clerk webhook created successfully!');
      console.log(`   Webhook ID: ${webhook.id}`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Events: ${webhook.events.join(', ')}`);

      // The webhook secret is returned in the response
      if (webhook.secret) {
        updateEnvFile(webhook.secret);
      }

      return webhook;
    } else {
      const error = await response.json();
      console.log('⚠️  Automatic setup failed:', error.message);
      console.log('   Falling back to manual setup instructions above.');
    }
  } catch (error) {
    console.log('⚠️  Automatic setup not available, use manual instructions above.');
    console.log('   Error:', error.message);
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

    // Check if CLERK_WEBHOOK_SECRET already exists
    const secretRegex = /^CLERK_WEBHOOK_SECRET=.*/m;
    const newSecretLine = `CLERK_WEBHOOK_SECRET=${webhookSecret}`;

    if (secretRegex.test(envContent)) {
      // Update existing line
      envContent = envContent.replace(secretRegex, newSecretLine);
      console.log('🔄 Updated existing CLERK_WEBHOOK_SECRET in .env.local');
    } else {
      // Add new line
      if (envContent && !envContent.endsWith('\n')) {
        envContent += '\n';
      }
      envContent += `\n${newSecretLine}\n`;
      console.log('✅ Added CLERK_WEBHOOK_SECRET to .env.local');
    }

    // Write back to file
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log('💾 Environment file updated');

  } catch (error) {
    console.error('❌ Failed to update .env.local file:', error.message);
    console.log('   Please manually add this line to your .env.local file:');
    console.log(`   CLERK_WEBHOOK_SECRET=${webhookSecret}`);
  }
}

async function testWebhook() {
  console.log('\n🧪 Testing Clerk webhook endpoint...');

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/clerk`;

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
      if (data.error === 'Missing webhook headers' || data.error === 'Webhook verification failed') {
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
  const args = process.argv.slice(2);

  if (args.includes('--test')) {
    await testWebhook();
    return;
  }

  try {
    const webhook = await setupClerkWebhook();

    if (webhook) {
      console.log('\n🎉 Clerk webhook setup completed!');
      console.log(`   Webhook ID: ${webhook.id}`);
      console.log(`   Webhook URL: ${webhook.url}`);
      console.log(`   Secret: ${webhook.secret ? '✅ Configured' : '❌ Missing'}`);

      // Test the webhook
      const testPassed = await testWebhook();
      if (testPassed) {
        console.log('✅ Webhook is working correctly');
      }
    }

  } catch (error) {
    console.error('❌ Failed to setup Clerk webhook:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupClerkWebhook, updateEnvFile };