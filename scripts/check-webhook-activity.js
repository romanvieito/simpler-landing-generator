#!/usr/bin/env node

/**
 * Check recent webhook activity and credit purchases
 * Run this after making a test purchase to verify webhooks are working
 */

require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function checkWebhookActivity() {
  try {
    console.log('🔍 Checking webhook activity in the last 10 minutes...\n');

    // Check for recent checkout.session.completed events
    const { rows: completedEvents } = await sql`
      SELECT event_type, status, message, user_id, amount, created_at
      FROM stripe_logs
      WHERE event_type = 'checkout.session.completed'
      AND created_at > NOW() - INTERVAL '10 minutes'
      ORDER BY created_at DESC
    `;

    console.log(`📊 Webhook Events: ${completedEvents.length} found`);
    completedEvents.forEach(event => {
      console.log(`   ${event.created_at.toISOString()}: ${event.status} - ${event.message}`);
      if (event.user_id) console.log(`     User: ${event.user_id}, Credits: ${event.amount}`);
    });

    // Check for recent credit purchases
    const { rows: purchases } = await sql`
      SELECT user_id, amount, description, created_at
      FROM credit_transactions
      WHERE type = 'purchase'
      AND created_at > NOW() - INTERVAL '10 minutes'
      ORDER BY created_at DESC
    `;

    console.log(`\n💰 Credit Purchases: ${purchases.length} found`);
    purchases.forEach(purchase => {
      console.log(`   ${purchase.created_at.toISOString()}: ${purchase.user_id} + ${purchase.amount} credits`);
      console.log(`     "${purchase.description}"`);
    });

    // Summary
    console.log('\n📋 Summary:');
    if (completedEvents.length > 0 && purchases.length > 0) {
      console.log('✅ Webhooks are working! Credits should be added to user accounts.');
    } else if (completedEvents.length > 0 && purchases.length === 0) {
      console.log('⚠️  Webhooks received but credits not added - check webhook processing logic.');
    } else if (completedEvents.length === 0 && purchases.length > 0) {
      console.log('❓ Credits added but no webhook events logged - unusual but possible.');
    } else {
      console.log('❌ No webhook activity detected in the last 10 minutes.');
      console.log('   Make sure you completed a purchase and wait a few seconds.');
    }

  } catch (error) {
    console.error('❌ Error checking webhook activity:', error.message);
  }

  process.exit(0);
}

if (require.main === module) {
  checkWebhookActivity();
}