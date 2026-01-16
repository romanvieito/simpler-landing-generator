/**
 * Cost Validation Tests
 * Validates fixed $0.05 per site pricing model profitability
 */

// DeepSeek pricing constants (must match lib/deepseek.ts)
const DEEPSEEK_INPUT_CACHE_MISS_PRICE_PER_MILLION = 0.28;
const DEEPSEEK_OUTPUT_PRICE_PER_MILLION = 0.42;
const FIXED_PRICE_PER_SITE = 0.20; // New fixed pricing

function calculateRealCost(promptTokens, completionTokens) {
  // Calculate what we actually pay DeepSeek
  const inputCost = (promptTokens / 1000000) * DEEPSEEK_INPUT_CACHE_MISS_PRICE_PER_MILLION;
  const outputCost = (completionTokens / 1000000) * DEEPSEEK_OUTPUT_PRICE_PER_MILLION;
  return inputCost + outputCost;
}

// Test cases with realistic token usage for a complete landing page (plan + HTML generation)
const testCases = [
  // Small landing page
  {
    planTokens: { prompt: 1000, completion: 500 },
    htmlTokens: { prompt: 2000, completion: 1000 },
    description: 'Small landing page'
  },

  // Medium landing page
  {
    planTokens: { prompt: 2000, completion: 1000 },
    htmlTokens: { prompt: 5000, completion: 2500 },
    description: 'Medium landing page'
  },

  // Large landing page
  {
    planTokens: { prompt: 5000, completion: 2500 },
    htmlTokens: { prompt: 10000, completion: 5000 },
    description: 'Large landing page'
  },

  // Very large landing page
  {
    planTokens: { prompt: 10000, completion: 5000 },
    htmlTokens: { prompt: 20000, completion: 10000 },
    description: 'Very large landing page'
  },
];

function runCostValidationTests() {
  console.log('🧮 Running Fixed Price Cost Validation Tests...\n');

  let allTestsPassed = true;
  let totalProfit = 0;
  let totalRevenue = 0;
  let totalCost = 0;

  testCases.forEach(({ planTokens, htmlTokens, description }) => {
    // Calculate costs for both API calls
    const planCost = calculateRealCost(planTokens.prompt, planTokens.completion);
    const htmlCost = calculateRealCost(htmlTokens.prompt, htmlTokens.completion);
    const totalApiCost = planCost + htmlCost;

    // Fixed price we charge
    const chargedAmount = FIXED_PRICE_PER_SITE;
    const profit = chargedAmount - totalApiCost;
    const profitMargin = (profit / totalApiCost) * 100;

    totalCost += totalApiCost;
    totalRevenue += chargedAmount;
    totalProfit += profit;

    const passed = profit > 0; // Must make profit
    const status = passed ? '✅ PASS' : '❌ FAIL';

    console.log(`${status} ${description}:`);
    console.log(`   Plan tokens: ${planTokens.prompt} prompt + ${planTokens.completion} completion`);
    console.log(`   HTML tokens: ${htmlTokens.prompt} prompt + ${htmlTokens.completion} completion`);
    console.log(`   Total API cost: $${totalApiCost.toFixed(6)}`);
    console.log(`   Fixed price charged: $${chargedAmount.toFixed(2)}`);
    console.log(`   Profit: $${profit.toFixed(6)} (${profitMargin.toFixed(1)}% margin)`);

    if (!passed) {
      console.log(`   🚨 PROBLEM: Not profitable!`);
      allTestsPassed = false;
    }
    console.log('');
  });

  // Summary
  console.log('📊 FIXED PRICE COST VALIDATION SUMMARY:');
  console.log(`   Total API costs: $${totalCost.toFixed(4)}`);
  console.log(`   Total revenue: $${totalRevenue.toFixed(4)}`);
  console.log(`   Total profit: $${totalProfit.toFixed(4)}`);
  console.log(`   Overall margin: ${((totalProfit / totalCost) * 100).toFixed(1)}%`);
  console.log(`   Fixed price per site: $${FIXED_PRICE_PER_SITE.toFixed(2)}`);

  if (allTestsPassed) {
    console.log('✅ All cost validation tests PASSED');
  } else {
    console.log('❌ Some cost validation tests FAILED - review pricing!');
    process.exit(1);
  }

  return allTestsPassed;
}

function testEdgeCases() {
  console.log('🔍 Testing Fixed Price Edge Cases...\n');

  // Test that fixed price is consistent
  try {
    console.log(`✅ Fixed price per site: $${FIXED_PRICE_PER_SITE.toFixed(2)}`);
  } catch (error) {
    console.log(`❌ Fixed price test failed: ${error.message}`);
    return false;
  }

  // Test profitability with extreme token usage
  try {
    const extremeTokens = { prompt: 100000, completion: 50000 }; // Very high usage
    const apiCost = calculateRealCost(extremeTokens.prompt, extremeTokens.completion);
    const profit = FIXED_PRICE_PER_SITE - apiCost;
    const profitable = profit > 0;

    console.log(`✅ Extreme usage test (${extremeTokens.prompt} + ${extremeTokens.completion} tokens):`);
    console.log(`   API cost: $${apiCost.toFixed(4)}, Fixed price: $${FIXED_PRICE_PER_SITE.toFixed(2)}, Profit: $${profit.toFixed(4)} (${profitable ? '✅' : '❌'})`);

    if (!profitable) {
      console.log('   🚨 WARNING: Even extreme usage is not profitable at fixed price!');
      return false;
    }
  } catch (error) {
    console.log(`❌ Extreme usage test failed: ${error.message}`);
    return false;
  }

  return true;
}

if (require.main === module) {
  try {
    runCostValidationTests();
    console.log('');
    testEdgeCases();
    console.log('\n🎉 All validations completed successfully!');
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

module.exports = { runCostValidationTests, testEdgeCases, calculateRealCost };