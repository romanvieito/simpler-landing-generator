// lib/vercel.ts
import { ensureFullHtml } from './utils';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN!;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // optional

if (!VERCEL_TOKEN) {
  console.warn('Missing VERCEL_TOKEN (required for publishing)');
}

type DomainInfo = {
  name: string;
  available: boolean;
  price?: number;
  currency?: string;
};

type PurchaseDomainArgs = {
  domain: string;
  projectId?: string;
};

type DomainPurchaseResult = {
  domain: string;
  projectId?: string;
  verified: boolean;
  nameservers?: string[];
};

type DeployArgs = {
  name: string;
  html: string;
  alias?: string; // Optional alias for shared project deployments
};

function getDeploymentUrl(hostname: string): string {
  if (!hostname) return '';
  if (hostname.startsWith('http://') || hostname.startsWith('https://')) return hostname;
  return `https://${hostname}`;
}

async function probePublic(url: string): Promise<{ ok: boolean; status?: number }> {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'manual' });
    if (res.status === 401 || res.status === 403) return { ok: false, status: res.status };
    // Treat any non-401/403 response as "public enough" for our purposes (even 404, which can happen briefly).
    return { ok: true, status: res.status };
  } catch {
    // Network/probe errors should not block publishing.
    return { ok: true };
  }
}

export async function deployStaticHtml({ name, html, alias }: DeployArgs): Promise<string> {
  if (!VERCEL_TOKEN) {
    throw new Error('Server missing VERCEL_TOKEN');
  }

  const sharedPublishProject = (process.env.VERCEL_PUBLISH_PROJECT || '').trim();
  const isSharedPublishProject = !!sharedPublishProject && sharedPublishProject === name;

  const full = ensureFullHtml(html);
  const query = new URLSearchParams();
  if (VERCEL_TEAM_ID) query.set('teamId', VERCEL_TEAM_ID);

  const deploymentConfig = {
    name,
    files: [{ file: 'index.html', data: full }],
    target: 'production',
    // For new projects, Vercel requires projectSettings in the payload.
    // Keep this minimal + valid; do NOT add unsupported fields (e.g. `public`).
    projectSettings: {
      framework: null,
      buildCommand: null,
      outputDirectory: null,
    },
    public: true, // Make deployment public (deployment-level)
  };

  console.log('Creating Vercel deployment with config:', {
    name,
    hasTeamId: !!VERCEL_TEAM_ID,
    public: deploymentConfig.public,
  });

  const res = await fetch(`https://api.vercel.com/v13/deployments?${query.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deploymentConfig),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel deploy error: ${res.status} ${text}`);
  }

  const data = await res.json();
  console.log('Vercel deployment response:', {
    status: res.status,
    data,
    url: data?.url,
    public: data?.public,
    projectId: data?.projectId
  });

  if (!data?.url) {
    throw new Error('Vercel did not return a URL');
  }

  // If we have a projectId, try to update the project settings to ensure it's public
  // and not protected by "Vercel Authentication / Deployment Protection".
  // Note: Vercel feature availability + schema can vary by plan/team settings; keep this best-effort.
  if (data.projectId) {
    try {
      console.log('Updating project privacy settings for project:', data.projectId);
      const projectQuery = new URLSearchParams();
      if (VERCEL_TEAM_ID) projectQuery.set('teamId', VERCEL_TEAM_ID);
      const projectUrl = `https://api.vercel.com/v9/projects/${data.projectId}${projectQuery.toString() ? `?${projectQuery.toString()}` : ''}`;

      const projectRes = await fetch(projectUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Note: Vercel's project schema varies by account/team settings.
          // Keep this best-effort and only include fields that may exist on some accounts/plans.
          // Best-effort: disable any deployment protection that would cause "Log in to Vercel" prompts.
          // Different accounts/plans expose these fields differently, so failures are non-fatal.
          deploymentProtection: 'none',
          security: { deploymentProtection: 'none' },
          passwordProtection: null,
          trustedIps: null,
          ssoProtection: null,
        }),
      });

      if (projectRes.ok) {
        console.log('Successfully updated project privacy settings');
      } else {
        console.warn('Failed to update project privacy settings:', await projectRes.text());
      }
    } catch (e) {
      console.warn('Error updating project privacy settings:', e);
    }
  }

  // If we have an alias to assign (for custom URLs in shared project mode)
  // NOTE: Alias assignment may not work in shared projects due to Vercel restrictions
  if (alias && data.id) {
    console.log('⚠️  WARNING: Attempting to assign alias in shared project mode. This may not work due to Vercel restrictions.');
    try {
      console.log('Assigning alias to deployment:', {
        alias,
        deploymentId: data.id,
        projectId: data.projectId,
        isSharedProject: isSharedPublishProject
      });

      // Try the correct Vercel API endpoint for assigning aliases
      // Include teamId if available
      const aliasQuery = new URLSearchParams();
      if (VERCEL_TEAM_ID) aliasQuery.set('teamId', VERCEL_TEAM_ID);
      const aliasEndpoint = `https://api.vercel.com/v2/deployments/${data.id}/aliases${aliasQuery.toString() ? `?${aliasQuery.toString()}` : ''}`;

      console.log('Alias assignment endpoint:', aliasEndpoint);

      let aliasRes = await fetch(aliasEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alias: alias
        }),
      });

      // Alternative: Try the v1 aliases endpoint if v2 fails
      if (!aliasRes.ok) {
        console.log('v2 endpoint failed, trying v1 aliases endpoint');
        const v1Query = new URLSearchParams();
        if (VERCEL_TEAM_ID) v1Query.set('teamId', VERCEL_TEAM_ID);
        const v1Endpoint = `https://api.vercel.com/v1/aliases${v1Query.toString() ? `?${v1Query.toString()}` : ''}`;

        const aliasResV1 = await fetch(v1Endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            alias: alias,
            deployment: data.id  // Note: 'deployment' not 'deploymentId'
          }),
        });

        const v1ResponseText = await aliasResV1.text();
        console.log('v1 alias assignment response:', {
          status: aliasResV1.status,
          statusText: aliasResV1.statusText,
          response: v1ResponseText
        });

        if (aliasResV1.ok) {
          console.log('Successfully assigned alias using v1 endpoint:', alias);
          // Use v1 response for further processing
          aliasRes = aliasResV1;
        } else {
          console.warn('v1 alias assignment also failed');
        }
      }

      const aliasResponseText = await aliasRes.text();
      console.log('Alias assignment response:', {
        status: aliasRes.status,
        statusText: aliasRes.statusText,
        response: aliasResponseText
      });

      if (aliasRes.ok) {
        console.log('Successfully assigned alias:', alias);

        // If alias assignment succeeds, try to return the alias URL
        const aliasUrl = `${alias}.vercel.app`;
        console.log('Testing alias URL availability:', aliasUrl);

        // Give it a moment for the alias to propagate
        await new Promise(resolve => setTimeout(resolve, 2000));

        const { ok: aliasOk, status } = await probePublic(`https://${aliasUrl}`);
        console.log('Alias URL probe result:', { ok: aliasOk, status, url: aliasUrl });

        if (aliasOk) {
          console.log('Returning alias URL:', aliasUrl);
          return aliasUrl;
        } else {
          console.warn('Alias URL not accessible yet, falling back to deployment URL');
        }
      } else {
        console.error('Failed to assign alias:', {
          status: aliasRes.status,
          statusText: aliasRes.statusText,
          response: aliasResponseText
        });

        // If alias assignment fails in shared project mode, return deployment URL
        // and throw an error to inform the user that URL renaming doesn't work in shared projects
        if (isSharedPublishProject) {
          console.error('❌ Alias assignment failed in shared project mode. URL renaming is not supported in shared projects.');
          throw new Error(
            `URL renaming is not supported when using a shared Vercel project (${process.env.VERCEL_PUBLISH_PROJECT}). ` +
            `To enable URL renaming, remove the VERCEL_PUBLISH_PROJECT environment variable and deploy each site to its own project.`
          );
        } else {
          // For individual projects, if alias assignment fails, still try to return it
          console.warn('Alias assignment failed, returning alias URL anyway');
          return `${alias}.vercel.app`;
        }
      }
    } catch (e) {
      console.error('Error assigning alias:', e);
      // For shared projects, if alias assignment fails, we should fail the entire deployment
      // because URL renaming is not supported
      if (isSharedPublishProject && alias) {
        console.error('❌ Failing deployment due to alias assignment failure in shared project mode');
        throw new Error(`URL renaming is not supported when using a shared Vercel project (${process.env.VERCEL_PUBLISH_PROJECT}). To enable URL renaming, remove the VERCEL_PUBLISH_PROJECT environment variable and deploy each site to its own project.`);
      }
    }
  }

  // Prefer returning the stable production domain if it's publicly reachable.
  // BUT: when publishing into a shared project, the stable domain would always point to the *latest*
  // deployment (not per-site). In that mode, we return the unique deployment URL instead.
  // If we have an alias, prioritize it for shared projects.
  const candidates = [
    ...(isSharedPublishProject && alias ? [`${alias}.vercel.app`] : []),
    ...(isSharedPublishProject ? [] : [`${name}.vercel.app`]),
    String(data.url),
  ].filter(Boolean);

  console.log('URL candidates for selection:', candidates);

  for (const host of candidates) {
    const url = getDeploymentUrl(host);
    const { ok, status } = await probePublic(url);
    if (ok) return host;
    if (status === 401 || status === 403) {
      // Continue trying other candidates first.
      continue;
    }
  }

  // If we got here, every candidate was explicitly protected.
  const deploymentUrl = getDeploymentUrl(String(data.url));
  throw new Error(
    `Published URL is protected by Vercel Deployment Protection (HTTP 401/403). ` +
      `Important: this publish flow creates/uses a Vercel project named "${name}" (not your main app project). ` +
      `Open that project in Vercel → Settings → Deployment Protection, and set protection to "None" (and ensure Vercel Authentication is disabled). ` +
      `Protected URL: ${deploymentUrl}`
  );
}

// Domain management functions
// Check if a domain is actually available for registration (not just in Vercel)
async function checkDomainRegistrationStatus(domain: string): Promise<boolean> {
  // First, check hardcoded list of obviously taken domains
  const obviouslyTaken = [
    'google.com', 'facebook.com', 'amazon.com', 'apple.com', 'microsoft.com',
    'nike.com', 'cocacola.com', 'coca-cola.com', 'twitter.com', 'instagram.com',
    'youtube.com', 'linkedin.com', 'github.com', 'stackoverflow.com', 'reddit.com',
    'netflix.com', 'spotify.com', 'uber.com', 'airbnb.com', 'paypal.com'
  ];

  if (obviouslyTaken.includes(domain.toLowerCase())) {
    return false;
  }

  try {
    // DNS lookup - if domain resolves to real IPs, it's likely registered
    const dnsRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`, {
      method: 'GET',
    });

    if (dnsRes.ok) {
      const dnsData = await dnsRes.json();
      const hasRecords = dnsData.Answer && dnsData.Answer.length > 0;

      if (hasRecords) {
        // Additional check: see if it's a real website
        try {
          const httpRes = await fetch(`http://${domain}`, {
            method: 'HEAD',
            redirect: 'manual',
            signal: AbortSignal.timeout(5000), // 5 second timeout
          });

          // If it returns a normal status, it's likely an active registered domain
          if (httpRes.status >= 200 && httpRes.status < 400) {
            return false; // Domain is active/registered
          }
        } catch (httpError) {
          // If HTTP request fails, domain might still be registered but could be parked/down
          return false;
        }
      }

      return !hasRecords;
    }
  } catch (error) {
    console.warn('DNS check failed:', error);
  }

  // Try WHOIS lookup as fallback
  try {
    const whoisRes = await fetch(`https://www.whois.com/whois/${encodeURIComponent(domain)}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DomainChecker/1.0)',
      },
    });

    if (whoisRes.ok) {
      const whoisHtml = await whoisRes.text();

      // Check for "available" indicators
      const availableIndicators = [
        'No match for',
        'NOT FOUND',
        'available for registration',
        'is free',
        'No Data Found',
        'Domain not found'
      ];

      const isAvailable = availableIndicators.some(indicator =>
        whoisHtml.includes(indicator)
      );

      if (isAvailable) {
        return true;
      }

      // Check for registration indicators
      const registeredIndicators = [
        'Domain Name:',
        'Creation Date:',
        'Registry Domain ID:',
        'Registrant:',
        'Name Server:'
      ];

      const isRegistered = registeredIndicators.some(indicator =>
        whoisHtml.includes(indicator)
      );

      return !isRegistered;
    }
  } catch (error) {
    console.warn('WHOIS check failed:', error);
  }

  // If all checks fail, err on the side of caution and say it's available
  // Better to allow purchase of taken domains than block available ones
  console.warn(`Could not verify registration status for ${domain}, assuming available`);
  return true;
}

export async function checkDomainAvailability(domain: string): Promise<DomainInfo> {
  if (!VERCEL_TOKEN) {
    throw new Error('Server missing VERCEL_TOKEN');
  }

  // First, check if domain is actually available for registration
  const isAvailable = await checkDomainRegistrationStatus(domain);

  if (!isAvailable) {
    return {
      name: domain,
      available: false,
      price: undefined,
      currency: undefined,
    };
  }

  const query = new URLSearchParams();
  if (VERCEL_TEAM_ID) query.set('teamId', VERCEL_TEAM_ID);

  try {
    // Check if domain is already in Vercel
    const res = await fetch(`https://api.vercel.com/v4/domains/${encodeURIComponent(domain)}${query.toString() ? `?${query.toString()}` : ''}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      // Domain exists in Vercel account
      return {
        name: domain,
        available: false, // Already managed by Vercel
        price: data.price,
        currency: data.currency,
      };
    }

    // Domain is available for purchase through Vercel
    return {
      name: domain,
      available: true,
      price: 1500, // $15/year - typical domain registration cost
      currency: 'usd',
    };
  } catch (error) {
    console.error('Error checking Vercel domain status:', error);
    // If Vercel check fails but domain is available, still allow purchase
    return {
      name: domain,
      available: true,
      price: 1500, // Default domain price
      currency: 'usd',
    };
  }
}

export async function purchaseDomain({ domain, projectId }: PurchaseDomainArgs): Promise<DomainPurchaseResult> {
  if (!VERCEL_TOKEN) {
    throw new Error('Server missing VERCEL_TOKEN');
  }

  const query = new URLSearchParams();
  if (VERCEL_TEAM_ID) query.set('teamId', VERCEL_TEAM_ID);

  try {
    // Add domain to Vercel WITHOUT auto-renewal
    // Domains will expire at the end of their registration period
    // Users must manually renew through the Domain Management Dashboard
    const addDomainRes = await fetch(`https://api.vercel.com/v4/domains${query.toString() ? `?${query.toString()}` : ''}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: domain,
        // Explicitly disable auto-renewal - domains will NOT renew automatically
        renew: false,
      }),
    });

    if (!addDomainRes.ok) {
      const errorText = await addDomainRes.text();
      throw new Error(`Failed to add domain: ${addDomainRes.status} ${errorText}`);
    }

    const domainData = await addDomainRes.json();
    console.log('Domain added to Vercel (NO auto-renewal):', {
      domain,
      verified: domainData.verified,
      nameservers: domainData.nameservers,
      // Note: renew: false prevents automatic renewal
      renewalDisabled: true
    });

    let result: DomainPurchaseResult = {
      domain,
      verified: domainData.verified || false,
      nameservers: domainData.nameservers,
    };

    // If projectId is provided, assign the domain to the project
    if (projectId) {
      try {
        const assignRes = await fetch(`https://api.vercel.com/v4/domains/${encodeURIComponent(domain)}/project${query.toString() ? `?${query.toString()}` : ''}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
          }),
        });

        if (assignRes.ok) {
          const assignData = await assignRes.json();
          console.log('Domain assigned to project:', assignData);
          result.projectId = projectId;
        } else {
          console.warn('Failed to assign domain to project:', await assignRes.text());
        }
      } catch (assignError) {
        console.warn('Error assigning domain to project:', assignError);
      }
    }

    return result;
  } catch (error) {
    console.error('Error purchasing domain:', error);
    throw error instanceof Error ? error : new Error('Failed to purchase domain');
  }
}

export async function verifyDomain(domain: string): Promise<{ verified: boolean; nameservers?: string[] }> {
  if (!VERCEL_TOKEN) {
    throw new Error('Server missing VERCEL_TOKEN');
  }

  const query = new URLSearchParams();
  if (VERCEL_TEAM_ID) query.set('teamId', VERCEL_TEAM_ID);

  try {
    const res = await fetch(`https://api.vercel.com/v3/domains/${encodeURIComponent(domain)}/verify${query.toString() ? `?${query.toString()}` : ''}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to verify domain: ${res.status}`);
    }

    const data = await res.json();
    return {
      verified: data.verified || false,
      nameservers: data.nameservers,
    };
  } catch (error) {
    console.error('Error verifying domain:', error);
    throw error instanceof Error ? error : new Error('Failed to verify domain');
  }
}

export async function getDomainStatus(domain: string): Promise<{ verified: boolean; configured: boolean; nameservers?: string[]; expiresAt?: string; renewable?: boolean }> {
  if (!VERCEL_TOKEN) {
    throw new Error('Server missing VERCEL_TOKEN');
  }

  const query = new URLSearchParams();
  if (VERCEL_TEAM_ID) query.set('teamId', VERCEL_TEAM_ID);

  try {
    const res = await fetch(`https://api.vercel.com/v4/domains/${encodeURIComponent(domain)}${query.toString() ? `?${query.toString()}` : ''}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to get domain status: ${res.status}`);
    }

    const data = await res.json();
    return {
      verified: data.verified || false,
      configured: data.configured || false,
      nameservers: data.nameservers,
      expiresAt: data.expiresAt, // When domain expires
      renewable: data.renewable, // Whether domain can be renewed
    };
  } catch (error) {
    console.error('Error getting domain status:', error);
    throw error instanceof Error ? error : new Error('Failed to get domain status');
  }
}

// Function to renew a domain (for future Domain Management Dashboard)
export async function renewDomain(domain: string): Promise<{ success: boolean; expiresAt?: string }> {
  if (!VERCEL_TOKEN) {
    throw new Error('Server missing VERCEL_TOKEN');
  }

  const query = new URLSearchParams();
  if (VERCEL_TEAM_ID) query.set('teamId', VERCEL_TEAM_ID);

  try {
    // This would need to be implemented when creating the Domain Management Dashboard
    // For now, this is a placeholder that throws an error
    throw new Error('Domain renewal not yet implemented. Use Domain Management Dashboard when available.');

    // Future implementation would:
    // 1. Create Stripe checkout session for renewal fee
    // 2. Call Vercel API to renew domain
    // 3. Update expiration date
  } catch (error) {
    console.error('Error renewing domain:', error);
    throw error instanceof Error ? error : new Error('Failed to renew domain');
  }
}
