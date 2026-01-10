#!/usr/bin/env node

/**
 * Manual credit addition script for purchases that didn't process via webhook
 * Run this to add credits for completed purchases that weren't processed
 */

require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function fixMissingCredits() {
  console.log('🔧 Manual Credit Addition Tool\n');

  // Get user input
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

  try {
    const userId = await ask('Enter the user ID (e.g., user_36cWLSOC4ppL3kHJGosEdxYekbs): ');
    const credits = parseInt(await ask('Enter the number of credits to add: '));
    const packageType = await ask('Enter package type (small/medium/large/custom): ');

    if (!userId || !credits || credits <= 0) {
      console.log('❌ Invalid input');
      rl.close();
      return;
    }

    console.log(`\nAdding ${credits} credits to user ${userId}...`);

    // Check current balance
    const currentBalance = await sql`SELECT balance FROM user_credits WHERE user_id = ${userId}`;
    const currentCredits = currentBalance.rows[0]?.balance || 0;
    console.log(`Current balance: ${currentCredits} credits`);

    // Add credits
    const result = await sql`
      INSERT INTO credit_transactions (user_id, amount, type, description, stripe_payment_id)
      VALUES (${userId}, ${credits}, 'purchase', 'Manual credit addition for ${packageType} package', 'manual_fix')
    `;

    // Update balance
    await sql`
      UPDATE user_credits
      SET balance = balance + ${credits}, updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    // Get new balance
    const newBalance = await sql`SELECT balance FROM user_credits WHERE user_id = ${userId}`;
    const finalCredits = newBalance.rows[0]?.balance || 0;

    console.log('✅ Credits added successfully!');
    console.log(`New balance: ${finalCredits} credits (+${credits})`);

  } catch (error) {
    console.error('❌ Error adding credits:', error.message);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  fixMissingCredits();
}