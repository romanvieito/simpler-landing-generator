#!/usr/bin/env node

/**
 * Monitoring Setup Script
 * Helps configure the monitoring environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  console.log(`🔧 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function createGitHubWorkflowInstructions() {
  console.log('📋 GitHub Actions Setup Instructions:');
  console.log('=====================================');
  console.log('');
  console.log('1. Go to your GitHub repository');
  console.log('2. Navigate to Settings → Secrets and variables → Actions');
  console.log('3. Add these repository secrets:');
  console.log('');
  console.log('   DEEPSEEK_API_KEY=your_deepseek_api_key_here');
  console.log('   DEEPSEEK_API_BASE=https://api.deepseek.com');
  console.log('   DEEPSEEK_MODEL=deepseek-chat');
  console.log('   VERCEL_TOKEN=your_vercel_token_here');
  console.log('');
  console.log('4. The workflow will automatically run on:');
  console.log('   - Every push to main/master branch');
  console.log('   - Daily at 9 AM UTC');
  console.log('   - Manual trigger via Actions tab');
  console.log('');
}

function createCronJobInstructions() {
  console.log('⏰ Optional: Daily Cron Job Setup');
  console.log('==================================');
  console.log('');
  console.log('For additional monitoring, add this to your server crontab:');
  console.log('');
  console.log('   # Daily cost analysis at 9 AM');
  console.log('   0 9 * * * cd /path/to/your/app && npm run ci:daily-monitor');
  console.log('');
  console.log('   # Weekly comprehensive check on Sundays');
  console.log('   0 9 * * 0 cd /path/to/your/app && npm run monitor:pricing');
  console.log('');
}

function testMonitoringSetup() {
  console.log('🧪 Testing Monitoring Setup...');
  console.log('');

  const tests = [
    { command: 'node test-cost-validation.js', desc: 'Cost validation' },
    { command: 'node scripts/check-deepseek-pricing.js', desc: 'Pricing monitor' },
    { command: 'node scripts/analyze-costs.js 1h', desc: 'Cost analysis' },
    { command: 'node scripts/deployment-monitor.js', desc: 'Deployment monitor' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`Testing ${test.desc}...`);
    try {
      execSync(test.command, { stdio: 'pipe', timeout: 10000 });
      console.log(`✅ ${test.desc} passed`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.desc} failed (may need environment variables)`);
      failed++;
    }
  }

  console.log('');
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('');

  if (failed > 0) {
    console.log('💡 Note: Some tests may fail without proper environment variables.');
    console.log('    Make sure DEEPSEEK_API_KEY is set for full testing.');
    console.log('');
  }
}

function main() {
  console.log('🚀 Setting up API Cost Monitoring...\n');

  // Test the monitoring scripts
  testMonitoringSetup();

  // Create workflow instructions
  createGitHubWorkflowInstructions();

  // Create cron job instructions
  createCronJobInstructions();

  console.log('🎉 Monitoring setup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Set up GitHub secrets as shown above');
  console.log('2. Push the code to trigger the first workflow run');
  console.log('3. Monitor the Actions tab for results');
  console.log('');
  console.log('For manual testing:');
  console.log('  npm run monitor:pricing    # Check pricing');
  console.log('  npm run test:costs         # Validate costs');
  console.log('  npm run monitor:costs 24h # Analyze costs');
}

if (require.main === module) {
  main();
}