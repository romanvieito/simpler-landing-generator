// app/sites/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

type Site = {
  id: string;
  title: string | null;
  html: string;
  vercel_url: string | null;
  created_at: string;
};

export default function SitePage() {
  const params = useParams();
  const id = params.id as string;
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSite();
  }, [id]);

  async function fetchSite() {
    try {
      const res = await fetch(`/api/sites/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setSite(data.site);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-50)' }}>
        <div className="container" style={{ padding: '2rem 0' }}>
          <Link href="/sites" className="link" style={{ marginBottom: '1rem', display: 'inline-block' }}>
            ← Back to My Sites
          </Link>
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ color: 'var(--color-gray-500)' }}>Loading site...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-50)' }}>
        <div className="container" style={{ padding: '2rem 0' }}>
          <Link href="/sites" className="link" style={{ marginBottom: '1rem', display: 'inline-block' }}>
            ← Back to My Sites
          </Link>
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <h1 className="text-2xl font-semibold text-gray-900" style={{ marginBottom: '0.5rem' }}>Site not found</h1>
            <p className="text-gray-600">This site may have been deleted or doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-50)' }}>
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
          <Link href="/sites" className="link">
            ← Back to My Sites
          </Link>
          {site.vercel_url && (
            <a
              href={`https://${site.vercel_url}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-success"
            >
              Open Live Site →
            </a>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <h1 className="text-xl font-semibold text-gray-900">
            {site.title || 'Untitled Site'}
          </h1>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
            Created {new Date(site.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="card" style={{
          backgroundColor: 'var(--color-white)',
          boxShadow: 'var(--shadow-xl)'
        }}>
          <div
            dangerouslySetInnerHTML={{ __html: site.html }}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
