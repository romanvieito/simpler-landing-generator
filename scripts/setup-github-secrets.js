#!/usr/bin/env node

/**
 * GitHub Secrets Setup Helper
 * Helps set up GitHub Actions secrets from existing Vercel environment
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupGitHubSecrets() {
  console.log('🔐 GitHub Actions Secrets Setup Helper\n');

  console.log('This script will help you set up GitHub Actions secrets.');
  console.log('You can either:');
  console.log('1. Copy secrets from Vercel');
  console.log('2. Enter them manually\n');

  const method = await ask('Choose method (1 or 2): ');

  const secrets = {};

  if (method === '1') {
    console.log('\n📋 Copy these secrets from your Vercel dashboard:');
    console.log('   Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables\n');

    console.log('Required secrets for GitHub Actions:');
    console.log('- DEEPSEEK_API_KEY');
    console.log('- DEEPSEEK_API_BASE (optional, defaults to https://api.deepseek.com)');
    console.log('- DEEPSEEK_MODEL (optional, defaults to deepseek-chat)');
    console.log('- VERCEL_TOKEN (for deployment)\n');
  }

  // Get secrets
  secrets.DEEPSEEK_API_KEY = await ask('DEEPSEEK_API_KEY: ');
  secrets.DEEPSEEK_API_BASE = await ask('DEEPSEEK_API_BASE (or press Enter for default): ') || 'https://api.deepseek.com';
  secrets.DEEPSEEK_MODEL = await ask('DEEPSEEK_MODEL (or press Enter for default): ') || 'deepseek-chat';
  secrets.VERCEL_TOKEN = await ask('VERCEL_TOKEN (for deployment): ');

  console.log('\n📝 GitHub Secrets Setup Instructions:');
  console.log('=====================================\n');

  console.log('1. Go to your GitHub repository');
  console.log('2. Click on "Settings" tab');
  console.log('3. Click on "Secrets and variables" in the left sidebar');
  console.log('4. Click on "Actions"');
  console.log('5. Click "New repository secret"');
  console.log('6. Add these secrets one by one:\n');

  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`   Name: ${key}`);
    console.log(`   Value: ${value}`);
    console.log('   → Click "Add secret"\n');
  });

  console.log('7. After adding all secrets, click the "Actions" tab in your repo');
  console.log('8. You should see the "Monitor DeepSeek Pricing & Costs" workflow');
  console.log('9. Click "Run workflow" → Select branch → Click "Run workflow"');

  console.log('\n✅ Once secrets are added, the monitoring will activate automatically!');
  console.log('\n💡 Test locally first:');
  console.log('   npm run monitor:pricing');
  console.log('   npm run test:costs');

  rl.close();
}

if (require.main === module) {
  setupGitHubSecrets().catch(console.error);
}