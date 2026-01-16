#!/usr/bin/env node

/**
 * Complete Clerk webhook setup for Vercel deployment
 * Handles webhook creation and environment variable setup
 */

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');

// Test Clerk API for webhook creation
async function testClerkWebhookAPI() {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;

  if (!clerkSecretKey) {
    console.log('⚠️  CLERK_SECRET_KEY not available locally');
    console.log('   This is normal for security reasons - API keys are not downloaded locally');
    console.log('   Will proceed with manual setup instructions');
    return false;
  }

  try {
    console.log('🔍 Testing Clerk API for webhook creation...');

    const response = await fetch('https://api.clerk.com/v1/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://httpbin.org/post', // Test URL
        events: ['user.created'],
        description: 'Test webhook',
        enabled: false,
      }),
    });

    if (response.ok) {
      const webhook = await response.json();
      console.log('✅ Clerk API supports webhook creation!');

      // Delete the test webhook
      if (webhook.id) {
        await fetch(`https://api.clerk.com/v1/webhooks/${webhook.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${clerkSecretKey}`,
          },
        });
        console.log('🧹 Cleaned up test webhook');
      }

      return true;
    } else {
      const error = await response.json();
      console.log('❌ Clerk API webhook creation failed:', error.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Clerk API test failed:', error.message);
    return false;
  }
}

async function createClerkWebhookViaAPI(webhookUrl) {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    return null;
  }

  try {
    console.log('🚀 Attempting automatic webhook creation via Clerk API...');

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
      console.log('✅ Webhook created successfully via Clerk API!');
      console.log(`   Webhook ID: ${webhook.id}`);
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Events: ${webhook.events?.join(', ')}`);
      console.log(`   Secret: ${webhook.secret ? '✅ Available' : '❌ Missing'}`);

      return webhook;
    } else {
      const error = await response.json();
      console.log('❌ Automatic webhook creation failed:', error.message);
      return null;
    }
  } catch (error) {
    console.log('❌ API webhook creation failed:', error.message);
    return null;
  }
}

async function setupClerkWebhookForVercel() {
  console.log('🚀 Setting up Clerk webhooks for Vercel deployment...');

  // Check if we're in a Vercel project
  try {
    execSync('vercel whoami', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Not logged in to Vercel. Please run: vercel login');
    process.exit(1);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error('❌ NEXT_PUBLIC_APP_URL not found. Please check your Vercel deployment.');
    process.exit(1);
  }

  const webhookUrl = `${appUrl}/api/webhooks/clerk`;

  // First, test if Clerk API supports webhook creation
  const apiSupported = await testClerkWebhookAPI();

  if (apiSupported) {
    console.log('\n🤖 Attempting fully automated setup...');
    const webhook = await createClerkWebhookViaAPI(webhookUrl);

    if (webhook && webhook.secret) {
      // Automatically set up the environment variable
      console.log('\n🔄 Setting up Vercel environment variable...');
      try {
        execSync(`vercel env add CLERK_WEBHOOK_SECRET`, {
          stdio: 'pipe',
          input: `${webhook.secret}\nproduction\nn\n`
        });

        console.log('✅ CLERK_WEBHOOK_SECRET added to Vercel');
        console.log('\n🔄 Redeploying to apply changes...');
        execSync('vercel --prod', { stdio: 'inherit' });

        console.log('\n🎉 Fully automated setup completed!');
        console.log(`   Webhook ID: ${webhook.id}`);
        console.log(`   URL: ${webhook.url}`);
        console.log('   Events: user.created, session.created');
        return;
      } catch (error) {
        console.error('❌ Vercel environment setup failed:', error.message);
      }
    }
  }

  // Fallback to manual instructions
  console.log('\n📋 Manual Setup Required:');
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
  console.log('8. Run this command with your secret:');
  console.log('');
  console.log('   node scripts/setup-clerk-webhook-vercel.js <your-webhook-secret>');
  console.log('='.repeat(60));

  // Check if webhook secret was provided as argument
  const webhookSecret = process.argv[2];
  if (!webhookSecret) {
    console.log('\n💡 Once you have the webhook secret from Clerk, run:');
    console.log(`   node scripts/setup-clerk-webhook-vercel.js whsec_your_secret_here`);
    return;
  }

  if (!webhookSecret.startsWith('whsec_')) {
    console.error('❌ Invalid webhook secret format. Should start with "whsec_"');
    process.exit(1);
  }

  console.log('\n🔄 Setting up environment variable in Vercel...');

  try {
    // Add the webhook secret to Vercel environment variables
    execSync(`vercel env add CLERK_WEBHOOK_SECRET`, {
      stdio: 'pipe',
      input: `${webhookSecret}\nproduction\nn\n`
    });

    console.log('✅ CLERK_WEBHOOK_SECRET added to Vercel production environment');

    // Redeploy to apply the new environment variable
    console.log('\n🔄 Triggering Vercel redeploy...');
    execSync('vercel --prod', { stdio: 'inherit' });

    console.log('\n🎉 Clerk webhook setup completed!');
    console.log(`   Webhook URL: ${webhookUrl}`);
    console.log('   Events: user.created, session.created');
    console.log('   Environment: Production (Vercel)');

  } catch (error) {
    console.error('❌ Failed to setup environment variable:', error.message);
    console.log('\n🔧 Manual setup:');
    console.log('1. Go to Vercel Dashboard: https://vercel.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Settings → Environment Variables');
    console.log('4. Add: CLERK_WEBHOOK_SECRET =', webhookSecret);
    console.log('5. Redeploy your application');
    process.exit(1);
  }
}

async function testWebhook() {
  console.log('\n🧪 Testing webhook endpoint...');

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/clerk`;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'webhook-test' })
    });

    console.log(`   Response status: ${response.status}`);

    if (response.status === 400) {
      const data = await response.json();
      if (data.error === 'Missing webhook headers') {
        console.log('✅ Webhook endpoint is responding correctly (needs proper headers)');
        return true;
      }
    }

    console.log('⚠️  Unexpected response');
    return false;

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--test')) {
    testWebhook();
  } else {
    setupClerkWebhookForVercel();
  }
}