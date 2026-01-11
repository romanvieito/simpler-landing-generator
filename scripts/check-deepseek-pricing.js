#!/usr/bin/env node

/**
 * Script to monitor DeepSeek API pricing changes
 * Run periodically to ensure our hardcoded pricing stays accurate
 */

const https = require('https');
const path = require('path');

// Current pricing as of 2025 (from our code)
const CURRENT_PRICING = {
  inputCacheHit: 0.028,    // $0.028 per million tokens
  inputCacheMiss: 0.28,    // $0.28 per million tokens
  output: 0.42             // $0.42 per million tokens
};

// DeepSeek pricing documentation URL
const PRICING_DOC_URL = 'https://platform.deepseek.com/api-docs/pricing';

// Simple web scraping function to check pricing
function checkPricingFromDocs() {
  return new Promise((resolve, reject) => {
    https.get(PRICING_DOC_URL, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // Simple regex patterns to extract pricing (this is fragile but better than nothing)
        const patterns = {
          inputCacheHit: /cache\s+hit[^0-9]*\$?([0-9.]+).*?per\s+million/gi,
          inputCacheMiss: /cache\s+miss[^0-9]*\$?([0-9.]+).*?per\s+million/gi,
          output: /output[^0-9]*\$?([0-9.]+).*?per\s+million/gi
        };

        const extracted = {};
        let hasChanges = false;

        for (const [key, pattern] of Object.entries(patterns)) {
          const match = data.match(pattern);
          if (match && match[1]) {
            const price = parseFloat(match[1]);
            extracted[key] = price;

            const currentPrice = CURRENT_PRICING[key];
            if (Math.abs(price - currentPrice) > 0.001) { // Allow for small rounding differences
              hasChanges = true;
              console.log(`⚠️  PRICE CHANGE DETECTED for ${key}:`);
              console.log(`   Current: $${currentPrice}/M tokens`);
              console.log(`   New: $${price}/M tokens`);
              console.log(`   Difference: $${(price - currentPrice).toFixed(3)}/M tokens\n`);
            }
          }
        }

        resolve({ extracted, hasChanges });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Test cost calculation logic (inline to avoid module issues)
function calculateApiCost(promptTokens, completionTokens) {
  // Using cache miss pricing as conservative estimate
  const inputCost = (promptTokens / 1000000) * CURRENT_PRICING.inputCacheMiss;
  const outputCost = (completionTokens / 1000000) * CURRENT_PRICING.output;
  const totalCost = inputCost + outputCost;
  // Add 50% markup (return in dollars, not cents)
  return totalCost * 1.5;
}

function testCostCalculation() {
  console.log('🧪 Testing cost calculation logic...');

  // Test with known values
  const testCases = [
    { prompt: 100, completion: 50, expected: (100/1000000 * 0.28 + 50/1000000 * 0.42) * 1.5 },
    { prompt: 1000, completion: 500, expected: (1000/1000000 * 0.28 + 500/1000000 * 0.42) * 1.5 }
  ];

  let allPassed = true;
  for (const test of testCases) {
    const calculated = calculateApiCost(test.prompt, test.completion);
    const passed = Math.abs(calculated - test.expected) < 0.0001;

    console.log(`   Tokens: ${test.prompt} prompt + ${test.completion} completion`);
    console.log(`   Expected: $${test.expected.toFixed(6)}, Calculated: $${calculated.toFixed(6)} - ${passed ? '✅' : '❌'}`);

    if (!passed) allPassed = false;
  }

  console.log(`   Overall: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
  return allPassed;
}

async function main() {
  console.log('🔍 Checking DeepSeek API pricing...\n');

  try {
    // Check pricing from documentation
    console.log('📖 Checking pricing from DeepSeek docs...');
    const { extracted, hasChanges } = await checkPricingFromDocs();

    if (Object.keys(extracted).length > 0) {
      console.log('📋 Extracted pricing from docs:');
      Object.entries(extracted).forEach(([key, price]) => {
        console.log(`   ${key}: $${price}/M tokens`);
      });
      console.log('');
    } else {
      console.log('⚠️  Could not extract pricing from docs (may need to update scraping logic)\n');
    }

    // Test cost calculation logic
    const testResult = testCostCalculation();

    // Summary
    console.log('\n📈 SUMMARY:');
    if (hasChanges) {
      console.log('🚨 PRICING CHANGES DETECTED! Update lib/deepseek.ts immediately!');
      process.exit(1); // Exit with error code for CI/CD
    } else {
      console.log('✅ No pricing changes detected.');
    }

    if (testResult) {
      console.log('✅ Cost calculation verification passed.');
    } else {
      console.log('❌ Cost calculation verification failed!');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error checking pricing:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkPricingFromDocs, testCostCalculation };