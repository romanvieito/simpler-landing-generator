// app/api/domains/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSite } from '@/lib/db';
import { getDomainStatus } from '@/lib/vercel';

type DomainInfo = {
  name: string;
  expiresAt?: string;
  verified: boolean;
  configured: boolean;
  renewable: boolean;
  siteId?: string;
  siteTitle?: string;
  purchaseDate?: string;
  status: 'active' | 'expiring' | 'expired' | 'unknown';
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all sites with custom domains
    // Note: In development, we allow access to all sites for testing
    const isDevelopment = process.env.NODE_ENV === 'development';

    let sitesWithDomains: any[] = [];

    if (isDevelopment) {
      // In development, get all sites with custom domains
      // This is a simplified approach - you'd want a proper domains table in production
      const { sql } = await import('@vercel/postgres');
      const { rows } = await sql`
        SELECT id, title, custom_domain, created_at
        FROM sites
        WHERE custom_domain IS NOT NULL
        AND custom_domain NOT LIKE '%.easyland.site'
        ORDER BY created_at DESC
      `;
      sitesWithDomains = rows;
    } else {
      // In production, only get user's sites
      const { sql } = await import('@vercel/postgres');
      const { rows } = await sql`
        SELECT id, title, custom_domain, created_at
        FROM sites
        WHERE user_id = ${userId}
        AND custom_domain IS NOT NULL
        AND custom_domain NOT LIKE '%.easyland.site'
        ORDER BY created_at DESC
      `;
      sitesWithDomains = rows;
    }

    const domains: DomainInfo[] = [];

    for (const site of sitesWithDomains) {
      if (!site.custom_domain) continue;

      try {
        // Get domain status from Vercel
        const domainStatus = await getDomainStatus(site.custom_domain);

        // Calculate status based on expiration
        let status: 'active' | 'expiring' | 'expired' | 'unknown' = 'unknown';

        if (domainStatus.expiresAt) {
          const expiryDate = new Date(domainStatus.expiresAt);
          const now = new Date();
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilExpiry < 0) {
            status = 'expired';
          } else if (daysUntilExpiry <= 30) {
            status = 'expiring';
          } else {
            status = 'active';
          }
        } else if (domainStatus.verified) {
          status = 'active';
        }

        domains.push({
          name: site.custom_domain,
          expiresAt: domainStatus.expiresAt,
          verified: domainStatus.verified,
          configured: domainStatus.configured,
          renewable: domainStatus.renewable || true,
          siteId: site.id,
          siteTitle: site.title,
          purchaseDate: site.created_at,
          status
        });
      } catch (error) {
        console.error(`Error fetching status for domain ${site.custom_domain}:`, error);
        // Still include the domain even if we can't get status
        domains.push({
          name: site.custom_domain,
          verified: false,
          configured: false,
          renewable: true,
          siteId: site.id,
          siteTitle: site.title,
          purchaseDate: site.created_at,
          status: 'unknown'
        });
      }
    }

    return NextResponse.json({ domains });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
  }
}