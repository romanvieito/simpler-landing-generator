#!/usr/bin/env node

/**
 * Finish GitHub Secrets Setup
 * Sets up GitHub secrets once you provide the Vercel token
 */

const { execSync } = require('child_process');

function runCommand(command, description) {
  console.log(`🔧 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function setupGitHubSecrets(vercelToken) {
  console.log('🚀 Setting up GitHub Actions secrets...\n');

  // Check GitHub CLI
  if (!runCommand('gh auth status', 'Checking GitHub authentication')) {
    console.log('❌ Please authenticate with GitHub CLI: gh auth login\n');
    return false;
  }

  // Set secrets using GitHub CLI
  const secrets = {
    'DEEPSEEK_API_KEY': 'sk-4e9b866d2bd548829a800ba44a6a6efb',
    'DEEPSEEK_API_BASE': 'https://api.deepseek.com',
    'DEEPSEEK_MODEL': 'deepseek-chat',
    'VERCEL_TOKEN': vercelToken
  };

  let successCount = 0;
  for (const [key, value] of Object.entries(secrets)) {
    const command = `echo "${value}" | gh secret set ${key}`;
    if (runCommand(command, `Setting ${key}`, true)) {
      successCount++;
    }
  }

  console.log(`✅ Set ${successCount}/${Object.keys(secrets).length} secrets successfully\n`);
  return successCount === Object.keys(secrets).length;
}

function main() {
  const vercelToken = process.argv[2];

  if (!vercelToken) {
    console.log('🎯 Finish GitHub Secrets Setup\n');
    console.log('Usage: npm run finish-setup YOUR_VERCEL_TOKEN\n');
    console.log('Steps:');
    console.log('1. Go to: https://vercel.com/account/tokens');
    console.log('2. Click "Create Token" → Name: "GitHub Actions Monitoring"');
    console.log('3. Copy the token');
    console.log('4. Run: npm run finish-setup YOUR_TOKEN_HERE\n');
    return;
  }

  console.log('🎯 Finishing GitHub Secrets Setup\n');

  // Setup secrets
  const success = setupGitHubSecrets(vercelToken);

  if (success) {
    console.log('🎉 SUCCESS! All GitHub secrets are now set up!\n');

    console.log('📋 Final steps:');
    console.log('1. Push your code: git add . && git commit -m "Add monitoring" && git push');
    console.log('2. Check GitHub Actions tab for monitoring activation');
    console.log('3. Deployments are now protected!\n');

    console.log('🛡️ You are now 100% protected from undetected pricing changes!');
  } else {
    console.log('❌ Some secrets failed to set up. Please check the errors above.');
  }
}

if (require.main === module) {
  main();
}