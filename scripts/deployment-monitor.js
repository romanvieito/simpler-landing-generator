#!/usr/bin/env node

/**
 * Deployment Monitor Script
 * Runs comprehensive checks before deployment to ensure pricing integrity
 */

const { execSync } = require('child_process');

function runCommand(command, description) {
  console.log(`🔍 ${description}...`);
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'inherit',
      timeout: 30000 // 30 second timeout
    });
    console.log(`✅ ${description} passed\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Running Deployment Pre-checks...\n');

  const checks = [
    {
      command: 'node test-cost-validation.js',
      description: 'Cost validation tests'
    },
    {
      command: 'node scripts/check-deepseek-pricing.js',
      description: 'DeepSeek pricing monitor'
    }
  ];

  let allPassed = true;

  for (const check of checks) {
    const passed = runCommand(check.command, check.description);
    if (!passed) {
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('🎉 All deployment checks passed! Safe to deploy.');
    process.exit(0);
  } else {
    console.error('🚨 Deployment checks failed! Do not deploy until issues are resolved.');
    console.error('\nTroubleshooting:');
    console.error('1. Check if DeepSeek API pricing has changed');
    console.error('2. Update lib/deepseek.ts if pricing changed');
    console.error('3. Verify cost calculations are correct');
    console.error('4. Run tests locally: npm run test:costs && npm run monitor:pricing');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Deployment monitor crashed:', error);
    process.exit(1);
  });
}

module.exports = { main };