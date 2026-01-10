#!/usr/bin/env node

/**
 * Helper script for setting up DNS records for easyland.site subdomains
 *
 * Usage: node scripts/setup-subdomain-dns.js <subdomain>
 *
 * Example: node scripts/setup-subdomain-dns.js mysite
 *
 * This will output the DNS record you need to add for mysite.easyland.site
 */

const subdomain = process.argv[2];

if (!subdomain) {
  console.error('Usage: node scripts/setup-subdomain-dns.js <subdomain>');
  console.error('Example: node scripts/setup-subdomain-dns.js mysite');
  process.exit(1);
}

// Validate subdomain format
const subdomainRegex = /^[a-zA-Z0-9-]+$/;
if (!subdomainRegex.test(subdomain)) {
  console.error('Invalid subdomain format. Use only letters, numbers, and hyphens.');
  process.exit(1);
}

const vercelProject = process.env.VERCEL_PUBLISH_PROJECT || 'simpler-published-sites';

console.log('🚀 DNS Setup Instructions for easyland.site');
console.log('==========================================');
console.log('');
console.log(`Subdomain: ${subdomain}.easyland.site`);
console.log(`Vercel Target: ${vercelProject}.vercel.app`);
console.log('');
console.log('Add this DNS record in your DNS provider:');
console.log('');
console.log('Type: CNAME');
console.log(`Name: ${subdomain}`);
console.log(`Value: ${vercelProject}.vercel.app`);
console.log('');
console.log('TTL: 300 (5 minutes) or default');
console.log('');
console.log('After adding the DNS record:');
console.log('1. Wait for DNS propagation (can take up to 24 hours)');
console.log('2. The subdomain should start working');
console.log('3. Vercel will automatically provision SSL');
console.log('');
console.log('To verify: Visit https://' + subdomain + '.easyland.site');