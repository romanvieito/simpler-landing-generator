// lib/dns.ts
import { execSync } from 'child_process';

export async function addSubdomainCNAME(subdomain: string): Promise<boolean> {
  try {
    // Extract just the subdomain part (remove .easyland.site if present)
    const subdomainName = subdomain.replace(/\.easyland\.site$/, '');

    console.log(`Setting up custom domain: ${subdomain}`);
    console.log(`Adding CNAME record: ${subdomainName}.easyland.site -> easyland.site`);

    // First check if the DNS record already exists
    try {
      const listCommand = `vercel dns list easyland.site --json`;
      const records = JSON.parse(execSync(listCommand, { encoding: 'utf8', stdio: 'pipe' }));
      const existingRecord = records.find((r: any) => r.name === subdomainName && r.type === 'CNAME');

      if (existingRecord) {
        console.log(`✅ DNS record already exists for ${subdomainName}.easyland.site`);
        return true;
      }
    } catch (listError) {
      console.warn('Could not check existing DNS records:', listError);
      // Continue with adding the record
    }

    // Add DNS record for the subdomain - point to main app for routing
    const dnsCommand = `vercel dns add easyland.site ${subdomainName} CNAME easyland.site`;
    execSync(dnsCommand, {
      stdio: 'pipe', // Don't inherit stdio to avoid showing output
      env: {
        ...process.env,
        VERCEL_TOKEN: process.env.VERCEL_TOKEN,
      }
    });

    console.log(`✅ Custom domain DNS setup complete for ${subdomain}`);
    console.log(`ℹ️  Subdomain will be routed to the appropriate site content`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to set up custom domain:', error);

    // If the error indicates the record already exists, consider it successful
    if (error.message && error.message.includes('already exists')) {
      console.log('✅ DNS record already exists (confirmed by error message)');
      return true;
    }

    return false;
  }
}

export async function removeSubdomainCNAME(subdomain: string): Promise<boolean> {
  try {
    // Extract just the subdomain part
    const subdomainName = subdomain.replace(/\.easyland\.site$/, '');

    console.log(`Removing CNAME record for ${subdomainName}.easyland.site`);

    // First, list DNS records to find the ID
    const listCommand = `vercel dns list easyland.site --json`;
    const records = JSON.parse(execSync(listCommand, { encoding: 'utf8' }));

    // Find the record for this subdomain
    const record = records.find((r: any) => r.name === subdomainName && r.type === 'CNAME');

    if (!record) {
      console.log(`No DNS record found for ${subdomainName}.easyland.site`);
      return true; // Not an error if it doesn't exist
    }

    // Remove the record
    const removeCommand = `vercel dns remove ${record.id}`;
    execSync(removeCommand, { stdio: 'inherit' });

    console.log(`✅ DNS record removed for ${subdomainName}.easyland.site`);
    return true;
  } catch (error) {
    console.error('❌ Failed to remove DNS record:', error);
    return false;
  }
}