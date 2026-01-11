// add-test-domain-renewal.js - Add a test domain for renewal modal testing
const { sql } = require('@vercel/postgres');
require('dotenv').config();

async function addTestDomain() {
  try {
    console.log('🔍 Connecting to database...');

    await sql`SELECT 1`;
    console.log('✅ Database connected');

    const siteId = 'test-site-renewal-' + Date.now().toString().slice(-6);
    const testDomain = 'renewal-test-' + Date.now().toString().slice(-6) + '.com';

    console.log('📝 Adding test domain for renewal testing...');
    console.log(`   Site ID: ${siteId}`);
    console.log(`   Domain: ${testDomain}`);

    await sql`
      INSERT INTO sites (id, user_id, title, description, plan, html, vercel_url, custom_domain, created_at)
      VALUES (
        ${siteId},
        'test-user-dev',
        'Domain Renewal Test Site',
        'Test site for testing domain renewal modal functionality',
        '{"headline": "Renewal Test", "subhead": "Testing domain renewal modal"}',
        '<html><body><h1>Domain Renewal Test</h1><p>Testing the renewal modal.</p></body></html>',
        'https://test-site.vercel.app',
        ${testDomain},
        NOW() - INTERVAL '30 days'
      )
    `;

    console.log('✅ Test domain added successfully!');
    console.log('');
    console.log('🎯 Test Data:');
    console.log(`   Domain: ${testDomain}`);
    console.log(`   Site: Domain Renewal Test Site`);
    console.log(`   Status: Unknown (not in Vercel)`);
    console.log('');
    console.log('🌐 Test: Visit http://localhost:3001/dashboard');
    console.log('🔄 Click "Renew" button on the domain card');
    console.log('📧 Modal should open with contact info');
    console.log('');
    console.log('🧹 Cleanup:');
    console.log(`DELETE FROM sites WHERE id = '${siteId}';`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

addTestDomain();