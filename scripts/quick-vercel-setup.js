#!/usr/bin/env node

/**
 * Quick Vercel Monitoring Setup
 * Streamlined setup using Vercel CLI
 */

const { execSync } = require('child_process');

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
    return null;
  }
}

async function main() {
  console.log('⚡ Quick Vercel Monitoring Setup\n');

  // Check Vercel login
  console.log('Step 1: Checking Vercel authentication...');
  const whoami = runCommand('vercel whoami', 'Checking Vercel login', { silent: true });
  if (!whoami) {
    console.log('❌ Please run: vercel login\n');
    process.exit(1);
  }

  // Link project
  console.log('Step 2: Linking Vercel project...');
  runCommand('vercel link --yes', 'Linking project', { continueOnError: true });

  // Show environment setup
  console.log('Step 3: Environment Setup Instructions\n');
  console.log('📋 Copy these from your Vercel dashboard:');
  console.log('   https://vercel.com/dashboard → Your Project → Settings → Environment Variables\n');
  console.log('   You need:');
  console.log('   ✅ DEEPSEEK_API_KEY');
  console.log('   ✅ DEEPSEEK_API_BASE (optional)');
  console.log('   ✅ DEEPSEEK_MODEL (optional)\n');

  // Get Vercel token
  console.log('Step 4: Create Vercel Token');
  console.log('   Go to: https://vercel.com/account/tokens');
  console.log('   Click "Create Token" → Name: "GitHub Monitoring" → Copy token\n');

  // GitHub setup
  console.log('Step 5: GitHub Actions Secrets Setup\n');
  console.log('   Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions\n');
  console.log('   Add these secrets:\n');

  console.log('   Name: DEEPSEEK_API_KEY');
  console.log('   Value: [paste from Vercel]\n');

  console.log('   Name: DEEPSEEK_API_BASE');
  console.log('   Value: https://api.deepseek.com\n');

  console.log('   Name: DEEPSEEK_MODEL');
  console.log('   Value: deepseek-chat\n');

  console.log('   Name: VERCEL_TOKEN');
  console.log('   Value: [paste Vercel token]\n');

  // Test setup
  console.log('Step 6: Testing Setup\n');
  console.log('   Run these commands to test:\n');
  console.log('   npm run test:costs           # Test cost validation');
  console.log('   npm run monitor:pricing      # Test pricing monitor');
  console.log('   npm run monitor:costs 1h     # Test cost analysis\n');

  // Deploy
  console.log('Step 7: Deploy & Activate\n');
  console.log('   Push to GitHub to activate monitoring:\n');
  console.log('   git add .');
  console.log('   git commit -m "Add API cost monitoring"');
  console.log('   git push origin main\n');

  // Status
  console.log('🎯 Monitoring Features Activated:');
  console.log('   ✅ Pre-deployment pricing checks');
  console.log('   ✅ Daily cost analysis (9 AM UTC)');
  console.log('   ✅ DeepSeek price change detection');
  console.log('   ✅ Profit margin validation');
  console.log('   ✅ Real-time cost alerts\n');

  console.log('📊 Monitor results in: GitHub Actions tab\n');

  console.log('🚀 Ready to go! Follow the steps above and you\'re protected! 🎉');
}

if (require.main === module) {
  main().catch(console.error);
}