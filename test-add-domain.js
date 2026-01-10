// test-add-domain.js - Add a test domain to the database for testing Domain Management
const { sql } = require('@vercel/postgres');
const crypto = require('crypto');
require('dotenv').config();

async function addTestDomain() {
  try {
    console.log('🔍 Checking database connection...');

    // Test database connection
    await sql`SELECT 1`;

    console.log('✅ Database connected successfully');

    // Generate a test user ID (you can replace this with your actual user ID)
    const testUserId = process.env.TEST_USER_ID || 'test-user-123';

    // Create a test site with a custom domain
    const siteId = 'test-site-' + crypto.randomUUID().slice(0, 8);
    const testDomain = 'example-test-domain.com'; // Use a domain that won't conflict

    console.log('📝 Adding test domain to database...');
    console.log(`   Site ID: ${siteId}`);
    console.log(`   Domain: ${testDomain}`);
    console.log(`   User ID: ${testUserId}`);

    // Insert the test site with custom domain
    await sql`
      INSERT INTO sites (id, user_id, title, description, plan, html, vercel_url, custom_domain, created_at)
      VALUES (
        ${siteId},
        ${testUserId},
        'Test Site with Domain',
        'This is a test site for testing the Domain Management Dashboard',
        ${JSON.stringify({ headline: 'Test Site', subhead: 'Testing domain management' })},
        '<html><body><h1>Test Site</h1><p>This is a test site with a custom domain.</p></body></html>',
        'https://test-site.vercel.app',
        ${testDomain},
        NOW() - INTERVAL '2 days'
      )
    `;

    console.log('✅ Test domain added successfully!');
    console.log('');
    console.log('📊 Test Data Summary:');
    console.log(`   Domain: ${testDomain}`);
    console.log(`   Site: Test Site with Domain`);
    console.log(`   Status: Should appear as "Unknown" (since not in Vercel)`);
    console.log(`   User: ${testUserId}`);
    console.log('');
    console.log('🌐 Test Instructions:');
    console.log('1. Go to http://localhost:3001/dashboard');
    console.log('2. Sign in with your account');
    console.log('3. Look for the "Domain Management" section');
    console.log('4. You should see the test domain listed');
    console.log('5. Click "Renew" to see the placeholder alert');
    console.log('');
    console.log('🧹 Cleanup:');
    console.log(`Run: DELETE FROM sites WHERE id = '${siteId}';`);

  } catch (error) {
    console.error('❌ Error adding test domain:', error);
    console.log('');
    console.log('💡 Possible issues:');
    console.log('1. Database not configured - check your POSTGRES_URL');
    console.log('2. Table doesn\'t exist - run the app first to create tables');
    console.log('3. Connection issues - check your database credentials');
  } finally {
    process.exit(0);
  }
}

// Check for command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node test-add-domain.js [user-id]');
  console.log('');
  console.log('Arguments:');
  console.log('  user-id    Your actual user ID (optional, defaults to test-user-123)');
  console.log('');
  console.log('Environment variables:');
  console.log('  TEST_USER_ID    Override the test user ID');
  console.log('  POSTGRES_URL    Database connection string');
  process.exit(0);
}

// Allow passing user ID as argument
if (args[0]) {
  process.env.TEST_USER_ID = args[0];
}

addTestDomain();