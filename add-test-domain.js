// add-test-domain.js - Add a test domain to the database
const { sql } = require('@vercel/postgres');
const crypto = require('crypto');
require('dotenv').config();

async function addTestDomain() {
  try {
    console.log('🔍 Connecting to database...');

    // Test connection
    await sql`SELECT 1`;
    console.log('✅ Database connected');

    // Generate test data
    const siteId = 'test-site-' + crypto.randomUUID().slice(0, 8);
    const testDomain = 'testdomain-' + crypto.randomUUID().slice(0, 8) + '.com';
    const testUserId = process.env.CLERK_TEST_USER_ID || 'test-user-dev';

    console.log('📝 Adding test domain...');
    console.log(`   Site ID: ${siteId}`);
    console.log(`   Domain: ${testDomain}`);
    console.log(`   User ID: ${testUserId}`);

    // Insert test site
    await sql`
      INSERT INTO sites (id, user_id, title, description, plan, html, vercel_url, custom_domain, created_at)
      VALUES (
        ${siteId},
        ${testUserId},
        'Test Domain Site',
        'Testing Domain Management Dashboard',
        ${JSON.stringify({ headline: 'Test Site', subhead: 'Domain testing' })},
        '<html><body><h1>Test Site</h1><p>Testing domain management.</p></body></html>',
        'https://test-site.vercel.app',
        ${testDomain},
        NOW() - INTERVAL '3 days'
      )
    `;

    console.log('✅ Test domain added successfully!');
    console.log('');
    console.log('🎯 Test Data:');
    console.log(`   Domain: ${testDomain}`);
    console.log(`   Site: Test Domain Site`);
    console.log(`   Status: Unknown (not in Vercel)`);
    console.log('');
    console.log('🌐 Test: Visit http://localhost:3001/dashboard');
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