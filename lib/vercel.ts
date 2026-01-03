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

  const res = await fetch(`https://api.vercel.com/v13/deployments?${query.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      files: [{ file: 'index.html', data: full }],
      target: 'production',
      projectSettings: { framework: null, buildCommand: null, outputDirectory: null },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel deploy error: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (!data?.url) {
    throw new Error('Vercel did not return a URL');
  }
  return data.url as string;
}
