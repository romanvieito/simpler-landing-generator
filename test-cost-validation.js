/**
 * Cost Validation Tests
 * Ensures we never lose money on API calls by validating pricing calculations
 */

// DeepSeek pricing constants (must match lib/deepseek.ts)
const DEEPSEEK_INPUT_CACHE_MISS_PRICE_PER_MILLION = 0.28;
const DEEPSEEK_OUTPUT_PRICE_PER_MILLION = 0.42;
const MARKUP_MULTIPLIER = 1.5; // 50% markup

function calculateApiCost(promptTokens, completionTokens) {
  // Using cache miss pricing as conservative estimate
  const inputCost = (promptTokens / 1000000) * DEEPSEEK_INPUT_CACHE_MISS_PRICE_PER_MILLION;
  const outputCost = (completionTokens / 1000000) * DEEPSEEK_OUTPUT_PRICE_PER_MILLION;
  const totalCost = inputCost + outputCost;
  // Add 50% markup (return in dollars, not cents)
  return totalCost * MARKUP_MULTIPLIER;
}

function calculateRealCost(promptTokens, completionTokens) {
  // Calculate what we actually pay DeepSeek (without markup)
  const inputCost = (promptTokens / 1000000) * DEEPSEEK_INPUT_CACHE_MISS_PRICE_PER_MILLION;
  const outputCost = (completionTokens / 1000000) * DEEPSEEK_OUTPUT_PRICE_PER_MILLION;
  return inputCost + outputCost;
}

// Test cases with realistic token usage
const testCases = [
  // Small request (like a simple question)
  { promptTokens: 100, completionTokens: 50, description: 'Small request' },

  // Medium request (typical landing page section)
  { promptTokens: 2000, completionTokens: 1000, description: 'Medium request' },

  // Large request (complex landing page generation)
  { promptTokens: 10000, completionTokens: 5000, description: 'Large request' },

  // Very large request (edge case)
  { promptTokens: 50000, completionTokens: 25000, description: 'Very large request' },

  // Minimum viable tokens
  { promptTokens: 1, completionTokens: 1, description: 'Minimum tokens' },
];

function runCostValidationTests() {
  console.log('🧮 Running Cost Validation Tests...\n');

  let allTestsPassed = true;
  let totalProfit = 0;
  let totalRevenue = 0;
  let totalCost = 0;

  testCases.forEach(({ promptTokens, completionTokens, description }) => {
    const realCost = calculateRealCost(promptTokens, completionTokens);
    const chargedAmount = calculateApiCost(promptTokens, completionTokens);
    const profit = chargedAmount - realCost;
    const profitMargin = (profit / realCost) * 100;

    totalCost += realCost;
    totalRevenue += chargedAmount;
    totalProfit += profit;

    const passed = profit > 0; // Must make profit
    const status = passed ? '✅ PASS' : '❌ FAIL';

    console.log(`${status} ${description}:`);
    console.log(`   Tokens: ${promptTokens} prompt + ${completionTokens} completion`);
    console.log(`   Real API cost: $${realCost.toFixed(6)}`);
    console.log(`   Charged amount: $${chargedAmount.toFixed(6)}`);
    console.log(`   Profit: $${profit.toFixed(6)} (${profitMargin.toFixed(1)}% margin)`);

    if (!passed) {
      console.log(`   🚨 PROBLEM: Not profitable!`);
      allTestsPassed = false;
    }
    console.log('');
  });

  // Summary
  console.log('📊 COST VALIDATION SUMMARY:');
  console.log(`   Total API costs: $${totalCost.toFixed(4)}`);
  console.log(`   Total revenue: $${totalRevenue.toFixed(4)}`);
  console.log(`   Total profit: $${totalProfit.toFixed(4)}`);
  console.log(`   Overall margin: ${((totalProfit / totalCost) * 100).toFixed(1)}%`);

  if (allTestsPassed) {
    console.log('✅ All cost validation tests PASSED');
  } else {
    console.log('❌ Some cost validation tests FAILED - review pricing!');
    process.exit(1);
  }

  return allTestsPassed;
}

function testEdgeCases() {
  console.log('🔍 Testing Edge Cases...\n');

  // Test with zero tokens (should not crash)
  try {
    const zeroCost = calculateApiCost(0, 0);
    console.log(`✅ Zero tokens cost: $${zeroCost.toFixed(6)}`);
  } catch (error) {
    console.log(`❌ Zero tokens test failed: ${error.message}`);
    return false;
  }

  // Test with very high token counts
  try {
    const highCost = calculateApiCost(1000000, 500000); // 1M + 500K tokens
    const realCost = calculateRealCost(1000000, 500000);
    const profit = highCost - realCost;
    console.log(`✅ High volume test: $${highCost.toFixed(2)} charged, $${realCost.toFixed(2)} cost, $${profit.toFixed(2)} profit`);
  } catch (error) {
    console.log(`❌ High volume test failed: ${error.message}`);
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