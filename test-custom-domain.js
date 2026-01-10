// Test script for custom domain DNS functionality
const { addSubdomainCNAME, removeSubdomainCNAME } = require('./lib/dns.ts');

async function testDNS() {
  console.log('🧪 Testing DNS functionality...\n');

  // Test adding a DNS record
  console.log('1. Adding DNS record for test.easyland.site...');
  const addResult = await addSubdomainCNAME('test.easyland.site');
  console.log('Add result:', addResult);

  // Wait a bit for DNS propagation
  console.log('\n2. Waiting 5 seconds for DNS propagation...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test DNS lookup
  console.log('\n3. Testing DNS lookup...');
  const { execSync } = require('child_process');
  try {
    const result = execSync('nslookup test.easyland.site', { encoding: 'utf8' });
    console.log('DNS lookup result:');
    console.log(result);
  } catch (error) {
    console.log('DNS lookup failed:', error.message);
  }

  // Test removing DNS record (optional)
  console.log('\n4. Cleaning up DNS record...');
  const removeResult = await removeSubdomainCNAME('test.easyland.site');
  console.log('Remove result:', removeResult);

  console.log('\n✅ DNS test completed!');
}

// Run the test
testDNS().catch(console.error);