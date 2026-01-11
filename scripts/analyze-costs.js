#!/usr/bin/env node

/**
 * Cost Analysis Script
 * Analyzes API costs from logs to monitor usage patterns and detect anomalies
 */

// Load environment variables from .env.local (like Next.js does)
require('dotenv').config({ path: '.env.local' });

// Debug: Check what environment variables are available
console.log(`🔍 Environment check:`);
console.log(`   POSTGRES_URL: ${process.env.POSTGRES_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   Working directory: ${process.cwd()}`);
console.log(`   .env.local exists: ${require('fs').existsSync('.env.local')}`);

// In CI/CD environments, GitHub Actions secrets are available as environment variables
// Make sure POSTGRES_URL is available for Vercel Postgres
if (!process.env.POSTGRES_URL) {
  console.error('\n❌ POSTGRES_URL environment variable is not set');
  console.error('   Make sure POSTGRES_URL is added to GitHub Actions secrets');
  console.error('   Available env vars:', Object.keys(process.env).filter(key => key.includes('POSTGRES')).join(', '));
  process.exit(1);
}

const { sql } = require('@vercel/postgres');

// Time periods for analysis
const PERIODS = {
  '1h': '1 hour',
  '24h': '24 hours',
  '7d': '7 days',
  '30d': '30 days'
};

async function getCostAnalytics(period = '24h') {
  const periodText = PERIODS[period] || period;

  console.log(`📊 Analyzing costs for the last ${periodText}...\n`);

  try {
    // Get credit transactions with API costs
    // Calculate the timestamp for the period
    const periodHours = period === '1h' ? 1 : period === '24h' ? 24 : period === '7d' ? 168 : period === '30d' ? 720 : 24;
    const periodTimestamp = new Date(Date.now() - (periodHours * 60 * 60 * 1000));

    const { rows } = await sql`
      SELECT
        ct.amount,
        ct.description,
        ct.created_at,
        ct.type
      FROM credit_transactions ct
      WHERE ct.created_at >= ${periodTimestamp}
        AND ct.type = 'usage'
        AND ct.description LIKE '%generation%'
      ORDER BY ct.created_at DESC
    `;

    if (rows.length === 0) {
      console.log('ℹ️  No API usage transactions found in the selected period.');
      return;
    }

    // Analyze costs
    let totalCreditsUsed = 0;
    let totalRevenue = 0; // Since 1 credit = $1
    let transactionCount = rows.length;
    let planGenerations = 0;
    let htmlGenerations = 0;

    // Extract cost information from descriptions
    rows.forEach(row => {
      const creditAmount = Math.abs(parseFloat(row.amount) || 0);
      totalCreditsUsed += creditAmount;

      // Parse cost from description (format: "Landing page X generation: $0.XXXX")
      const costMatch = row.description.match(/\$([0-9.]+)/);
      if (costMatch) {
        const apiCost = parseFloat(costMatch[1]);
        totalRevenue += apiCost;
      }

      if (row.description.includes('plan generation')) {
        planGenerations++;
      } else if (row.description.includes('HTML generation')) {
        htmlGenerations++;
      }
    });

    // Calculate metrics
    const avgCostPerGeneration = totalRevenue / transactionCount;
    const avgCreditsPerGeneration = totalCreditsUsed / transactionCount;
    const profit = totalCreditsUsed - totalRevenue; // Credits charged minus API costs
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    console.log('💰 COST ANALYSIS SUMMARY:');
    console.log(`   Period: Last ${periodText}`);
    console.log(`   Total transactions: ${transactionCount}`);
    console.log(`   Plan generations: ${planGenerations}`);
    console.log(`   HTML generations: ${htmlGenerations}`);
    console.log(`   Total credits charged: $${totalCreditsUsed.toFixed(4)}`);
    console.log(`   Total API costs: $${totalRevenue.toFixed(4)}`);
    console.log(`   Total profit: $${profit.toFixed(4)}`);
    console.log(`   Profit margin: ${profitMargin.toFixed(2)}%`);
    console.log(`   Avg cost per generation: $${avgCostPerGeneration.toFixed(6)}`);
    console.log(`   Avg credits per generation: $${avgCreditsPerGeneration.toFixed(6)}`);

    // Check for anomalies
    console.log('\n🚨 ANOMALY DETECTION:');

    // High cost alerts
    const highCostTransactions = rows.filter(row => {
      const costMatch = row.description.match(/\$([0-9.]+)/);
      return costMatch && parseFloat(costMatch[1]) > 0.1; // Over $0.10
    });

    if (highCostTransactions.length > 0) {
      console.log(`   ⚠️  ${highCostTransactions.length} transactions exceeded $0.10 cost threshold`);
      highCostTransactions.slice(0, 3).forEach(row => {
        const costMatch = row.description.match(/\$([0-9.]+)/);
        if (costMatch) {
          console.log(`      - ${row.created_at.toISOString()}: $${costMatch[1]} (${row.description.split(':')[0]})`);
        }
      });
      if (highCostTransactions.length > 3) {
        console.log(`      ... and ${highCostTransactions.length - 3} more`);
      }
    } else {
      console.log('   ✅ No unusually high-cost transactions detected');
    }

    // Negative profit alerts (shouldn't happen with validation)
    if (profit < 0) {
      console.log(`   🚨 CRITICAL: Negative profit detected! $${profit.toFixed(4)} loss`);
    } else {
      console.log('   ✅ Positive profit maintained');
    }

    // Low margin alerts
    if (profitMargin < 30) {
      console.log(`   ⚠️  Low profit margin: ${profitMargin.toFixed(2)}% (below 30% threshold)`);
    } else {
      console.log('   ✅ Healthy profit margin maintained');
    }

  } catch (error) {
    console.error('❌ Error analyzing costs:', error.message);
    process.exit(1);
  }
}

async function main() {
  const period = process.argv[2] || '24h';

  if (!PERIODS[period] && period !== '24h') {
    console.log('Usage: node analyze-costs.js [period]');
    console.log('Available periods: 1h, 24h, 7d, 30d');
    process.exit(1);
  }

  await getCostAnalytics(period);
}

if (require.main === module) {
  main();
}

module.exports = { getCostAnalytics };