#!/usr/bin/env node

/**
 * Automated GitHub Secrets Setup
 * Reads from Vercel/local env and sets up GitHub secrets
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description, silent = false) {
  console.log(`🔧 ${description}...`);
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    console.log(`✅ ${description} completed\n`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return null;
  }
}

function readLocalEnv() {
  console.log('📄 Reading local environment variables...\n');

  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found. Run: vercel env pull\n');
    return null;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  // Parse .env.local file
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.includes('DEEPSEEK_API_KEY')) {
      const match = line.match(/DEEPSEEK_API_KEY=(.+)/);
      if (match) {
        envVars.DEEPSEEK_API_KEY = match[1].replace(/['"]/g, '');
        console.log('✅ Found DEEPSEEK_API_KEY in .env.local');
      }
    }
  }

  return envVars;
}

function createVercelToken() {
  console.log('🔑 Creating Vercel token for GitHub Actions...\n');

  console.log('Please go to: https://vercel.com/account/tokens');
  console.log('1. Click "Create Token"');
  console.log('2. Name: "GitHub Actions Monitoring"');
  console.log('3. Copy the token');
  console.log('4. Paste it here:\n');

  // Note: In a real automated setup, we'd use browser automation here
  // For now, we'll prompt the user
  console.log('Since I cannot automate browser interactions, please:');
  console.log('1. Create the token manually at the URL above');
  console.log('2. Copy the token value');
  console.log('3. Run this script again with the token as an argument:');
  console.log('   node scripts/auto-setup-secrets.js YOUR_VERCEL_TOKEN\n');

  return null;
}

function setupGitHubSecrets(secrets) {
  console.log('🚀 Setting up GitHub Actions secrets...\n');

  // Check GitHub CLI
  const ghCheck = runCommand('gh auth status', 'Checking GitHub authentication', true);
  if (!ghCheck) {
    console.log('❌ Please authenticate with GitHub CLI first:');
    console.log('   gh auth login\n');
    return false;
  }

  // Set secrets
  const secretsToSet = {
    'DEEPSEEK_API_KEY': secrets.DEEPSEEK_API_KEY,
    'DEEPSEEK_API_BASE': 'https://api.deepseek.com',
    'DEEPSEEK_MODEL': 'deepseek-chat',
    'VERCEL_TOKEN': secrets.VERCEL_TOKEN
  };

  for (const [key, value] of Object.entries(secretsToSet)) {
    if (value) {
      const command = `echo "${value}" | gh secret set ${key}`;
      runCommand(command, `Setting ${key}`, true);
    } else {
      console.log(`⚠️  Skipping ${key} - no value provided`);
    }
  }

  return true;
}

async function main() {
  console.log('🤖 Automated GitHub Secrets Setup\n');

  // Get Vercel token from command line if provided
  const vercelToken = process.argv[2];

  // Read local environment
  const localEnv = readLocalEnv();
  if (!localEnv) {
    console.log('💡 Tip: Run "vercel env pull" to download your environment variables locally\n');
    process.exit(1);
  }

  // Get Vercel token
  let token = vercelToken;
  if (!token) {
    token = createVercelToken();
    if (!token) {
      process.exit(0);
    }
  }

  // Combine secrets
  const secrets = {
    ...localEnv,
    VERCEL_TOKEN: token
  };

  // Setup GitHub secrets
  const success = setupGitHubSecrets(secrets);

  if (success) {
    console.log('🎉 GitHub secrets setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Push your code: git add . && git commit -m "Add monitoring" && git push');
    console.log('2. Check GitHub Actions tab for monitoring results');
    console.log('3. Monitor will run automatically on pushes and daily at 9 AM UTC\n');

    console.log('🛡️ You are now protected from undetected pricing changes!');
  }
}

if (require.main === module) {
  main().catch(console.error);
}