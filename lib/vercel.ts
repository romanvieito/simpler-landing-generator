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
};

export async function deployStaticHtml({ name, html }: DeployArgs): Promise<string> {
  if (!VERCEL_TOKEN) {
    throw new Error('Server missing VERCEL_TOKEN');
  }

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
          // We keep this best-effort, but avoid putting these into projectSettings.
          public: true,
          privacy: 'public',
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

  return data.url as string;
}
