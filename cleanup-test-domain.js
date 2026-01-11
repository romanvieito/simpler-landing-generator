// cleanup-test-domain.js - Remove test domain from database
const { sql } = require('@vercel/postgres');
require('dotenv').config();

async function cleanupTestDomain() {
  try {
    console.log('🧹 Cleaning up test domain data...');

    // Test connection
    await sql`SELECT 1`;
    console.log('✅ Database connected');

    // Delete the test site
    const result = await sql`
      DELETE FROM sites WHERE id = 'test-site-5600cdce'
    `;

    console.log(`✅ Deleted ${result.rowCount} test site(s)`);
    console.log('');
    console.log('🧽 Database cleanup completed!');
    console.log('The Domain Management Dashboard should now show "No custom domains yet"');

  } catch (error) {
    console.error('❌ Error cleaning up:', error.message);
  } finally {
    process.exit(0);
  }
}

cleanupTestDomain();