// lib/vercel.ts
import { ensureFullHtml } from './utils';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN!;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // optional

if (!VERCEL_TOKEN) {
  console.warn('Missing VERCEL_TOKEN (required for publishing)');
}

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

      const aliasRes = await fetch(aliasEndpoint, {
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
