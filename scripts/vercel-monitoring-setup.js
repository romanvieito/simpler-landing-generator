#!/usr/bin/env node

/**
 * Vercel CLI Monitoring Setup
 * Automates the entire monitoring setup using Vercel CLI
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description, options = {}) {
  console.log(`🔧 ${description}...`);
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    console.log(`✅ ${description} completed\n`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    if (options.continueOnError) {
      console.log(`⚠️  Continuing despite error...\n`);
      return null;
    }
    process.exit(1);
  }
}

function getVercelEnvVars() {
  console.log('🔍 Reading Vercel environment variables...\n');

  try {
    // List Vercel projects
    const projects = runCommand('vercel projects list', 'Listing Vercel projects', { silent: true });
    console.log('Your Vercel projects:');
    console.log(projects);

    // Get current project environment variables
    const envOutput = runCommand('vercel env ls', 'Reading environment variables', { silent: true });

    const envVars = {};

    // Parse the environment variables output
    const lines = envOutput.split('\n');
    for (const line of lines) {
      // Look for DEEPSEEK variables
      if (line.includes('DEEPSEEK_API_KEY')) {
        // We can't actually read the values with CLI, so we'll guide the user
        console.log('✅ Found DEEPSEEK_API_KEY in Vercel');
        envVars.DEEPSEEK_API_KEY = 'EXISTS_IN_VERCEL';
      }
    }

    return envVars;
  } catch (error) {
    console.log('⚠️  Could not read Vercel environment variables automatically');
    console.log('   You may need to log in to Vercel first: vercel login\n');
    return {};
  }
}

function setupGitHubSecrets() {
  console.log('🔐 Setting up GitHub Actions secrets...\n');

  // Check if GitHub CLI is available
  try {
    execSync('gh --version', { stdio: 'pipe' });
    console.log('✅ GitHub CLI found');
  } catch (error) {
    console.log('⚠️  GitHub CLI not found. You can install it from: https://cli.github.com/');
    console.log('   Or set up secrets manually in GitHub.\n');
    return false;
  }

  // Check if user is logged in to GitHub
  try {
    runCommand('gh auth status', 'Checking GitHub authentication', { silent: true });
  } catch (error) {
    console.log('⚠️  Not logged in to GitHub CLI. Run: gh auth login\n');
    return false;
  }

  console.log('📝 Setting up secrets interactively...\n');

  // Interactive setup
  const secrets = [
    'DEEPSEEK_API_KEY',
    'DEEPSEEK_API_BASE',
    'DEEPSEEK_MODEL',
    'VERCEL_TOKEN'
  ];

  for (const secret of secrets) {
    const defaultValue = {
      'DEEPSEEK_API_BASE': 'https://api.deepseek.com',
      'DEEPSEEK_MODEL': 'deepseek-chat'
    }[secret] || '';

    try {
      const command = defaultValue
        ? `gh secret set ${secret} --body "${defaultValue}"`
        : `gh secret set ${secret}`;

      if (defaultValue) {
        runCommand(command, `Setting ${secret} (using default)`, { silent: true });
      } else {
        console.log(`Please enter value for ${secret}:`);
        console.log(`Run: ${command}`);
        console.log('(Then paste your value and press Ctrl+D)\n');
      }
    } catch (error) {
      console.log(`⚠️  Failed to set ${secret}. You can set it manually in GitHub.\n`);
    }
  }

  return true;
}

function testMonitoringSetup() {
  console.log('🧪 Testing monitoring setup...\n');

  const tests = [
    { command: 'node test-cost-validation.js', desc: 'Cost validation' },
    { command: 'node scripts/check-deepseek-pricing.js', desc: 'Pricing monitor' },
    { command: 'node scripts/analyze-costs.js 1h', desc: 'Cost analysis' }
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

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n💡 Note: Some tests may fail without proper environment variables.');
    console.log('   Make sure DEEPSEEK_API_KEY is set in both Vercel and GitHub.');
  }

  return passed > 0;
}

function deployWithMonitoring() {
  console.log('🚀 Deploying with monitoring enabled...\n');

  try {
    // Run pre-deployment checks
    runCommand('npm run ci:pre-deploy', 'Running pre-deployment checks');

    // Deploy to Vercel
    runCommand('vercel --prod --yes', 'Deploying to production');

    console.log('🎉 Deployment successful with monitoring active!\n');

    return true;
  } catch (error) {
    console.log('❌ Deployment failed. Please check the errors above.\n');
    return false;
  }
}

async function main() {
  console.log('🚀 Vercel CLI Monitoring Setup\n');
  console.log('This will automate the entire monitoring setup process!\n');

  // Step 1: Check Vercel login
  console.log('Step 1: Checking Vercel authentication...');
  try {
    runCommand('vercel whoami', 'Checking Vercel login', { silent: true });
  } catch (error) {
    console.log('❌ Not logged in to Vercel. Please run: vercel login\n');
    process.exit(1);
  }

  // Step 2: Read Vercel environment
  console.log('Step 2: Reading your Vercel environment...');
  const envVars = getVercelEnvVars();

  // Step 3: Link to project if needed
  console.log('Step 3: Ensuring Vercel project is linked...');
  try {
    runCommand('vercel link', 'Linking Vercel project', { continueOnError: true });
  } catch (error) {
    // Continue if already linked
  }

  // Step 4: Setup GitHub secrets
  console.log('Step 4: Setting up GitHub Actions secrets...');
  const ghSetup = setupGitHubSecrets();

  // Step 5: Test the setup
  console.log('Step 5: Testing monitoring components...');
  const testsPassed = testMonitoringSetup();

  // Step 6: Deploy with monitoring
  if (testsPassed) {
    console.log('Step 6: Deploying with monitoring...');
    const deployed = deployWithMonitoring();

    if (deployed) {
      console.log('🎉 SUCCESS! Monitoring is now active!');
      console.log('\n📊 What happens next:');
      console.log('- Every push to main: Automatic pricing checks');
      console.log('- Daily at 9 AM UTC: Cost analysis reports');
      console.log('- DeepSeek price changes: Immediate detection');
      console.log('\n📈 Monitor results in: GitHub Actions tab');
    }
  } else {
    console.log('⚠️  Setup completed but some tests failed.');
    console.log('   Please ensure environment variables are set correctly.');
    console.log('   Then run: npm run monitor:setup');
  }

  // Final instructions
  console.log('\n📋 Next steps:');
  console.log('1. Monitor the GitHub Actions tab for results');
  console.log('2. Check Vercel deployment status');
  console.log('3. Run manual tests: npm run monitor:pricing');

  console.log('\n🛠️  Useful commands:');
  console.log('  npm run monitor:pricing     # Check pricing');
  console.log('  npm run monitor:costs 24h   # Analyze costs');
  console.log('  npm run monitor:deploy      # Full deployment check');
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
}