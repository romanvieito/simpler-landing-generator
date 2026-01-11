// test-domains.js - Test script for Domain Management functionality
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testDomainsAPI() {
  console.log('🔍 Testing Domain Management API...\n');

  try {
    // Test 1: API endpoint accessibility
    console.log('1. Testing /api/domains endpoint...');
    const response = await fetch(`${BASE_URL}/api/domains`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      console.log('   ✅ API accessible (401 Unauthorized - expected without auth)');
      console.log('   📝 This is normal - authentication is required');
    } else if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API responding:', data);
    } else {
      console.log('   ❌ API error:', response.status, response.statusText);
    }

  } catch (error) {
    console.log('   ❌ Connection failed. Is the server running?');
    console.log('   💡 Run: npm run dev');
    console.log('   🔗 Then visit: http://localhost:3001');
  }
}

// Manual testing instructions
function printTestingInstructions() {
  console.log('\n📋 MANUAL TESTING INSTRUCTIONS:');
  console.log('================================');

  console.log('\n1. 🌐 Visit Dashboard:');
  console.log('   http://localhost:3001/dashboard');

  console.log('\n2. 🔐 Sign In:');
  console.log('   - Click "Sign In" button');
  console.log('   - Use your Clerk credentials');

  console.log('\n3. 📊 Check Domain Management Section:');
  console.log('   - Look for "Domain Management" section');
  console.log('   - Should show between "Your Sites" and "Recent Leads"');

  console.log('\n4. 🎯 Test Different States:');

  console.log('\n   a) No Domains State:');
  console.log('      - If no custom domains: shows "No custom domains yet"');
  console.log('      - Message explains domains don\'t auto-renew');

  console.log('\n   b) With Domains State:');
  console.log('      - Shows domain cards with status indicators');
  console.log('      - Green: Active domains');
  console.log('      - Yellow: Expiring soon (30 days)');
  console.log('      - Red: Expired domains');

  console.log('\n5. 🧪 Test Domain Actions:');

  console.log('\n   a) Renew Button:');
  console.log('      - Click "Renew" on any domain');
  console.log('      - Shows alert (not yet implemented)');
  console.log('      - In future: will create Stripe checkout');

  console.log('\n   b) Visit Domain:');
  console.log('      - Click globe icon → opens domain in new tab');

  console.log('\n   c) View Site:');
  console.log('      - Click site icon → goes to site details');

  console.log('\n6. 📱 Test Responsiveness:');
  console.log('   - Resize browser window');
  console.log('   - Check mobile/tablet layouts');

  console.log('\n7. 🔄 Test Loading States:');
  console.log('   - Refresh page to see loading spinners');
  console.log('   - Check "Loading your domains..." text');

  console.log('\n🎉 SUCCESS INDICATORS:');
  console.log('======================');
  console.log('✅ Domain Management section appears');
  console.log('✅ No JavaScript errors in browser console');
  console.log('✅ Cards display properly with status indicators');
  console.log('✅ Buttons work (show alerts for renew)');
  console.log('✅ Responsive design works');
  console.log('✅ Loading states work correctly');
}

// Create test domain data
function createTestDomainInstructions() {
  console.log('\n🛠️  CREATE TEST DATA:');
  console.log('===================');

  console.log('\nTo test with real domains, you can:');

  console.log('\n1. 🎯 Create a Test Site with Domain:');
  console.log('   - Go to http://localhost:3001');
  console.log('   - Generate a landing page');
  console.log('   - Publish it to get a .vercel.app URL');
  console.log('   - Then buy a custom domain for it');

  console.log('\n2. 💰 Test Domain Purchase Flow:');
  console.log('   - In dashboard, find a site without domain');
  console.log('   - Click "Buy Domain" button');
  console.log('   - Use Stripe test card: 4242 4242 4242 4242');
  console.log('   - Complete purchase');
  console.log('   - Check Domain Management section');

  console.log('\n3. 🔧 Manual Database Entry (for testing):');
  console.log('   - Add a row to your sites table with custom_domain');
  console.log('   - Make sure it\'s not a .easyland.site subdomain');
  console.log('   - Refresh dashboard to see it appear');
}

// Run tests
async function runTests() {
  await testDomainsAPI();
  printTestingInstructions();
  createTestDomainInstructions();

  console.log('\n🚀 Ready to test! Open your browser and follow the instructions above.');
}

runTests().catch(console.error);