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
      <main style={{ padding: 16 }}>
        <a href="/sites" style={{ color: '#2563eb' }}>← Back</a>
        <h1>Loading...</h1>
      </main>
    );
  }

  if (!site) {
    return (
      <main style={{ padding: 16 }}>
        <a href="/sites" style={{ color: '#2563eb' }}>← Back</a>
        <h1>Not found</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <a href="/sites" style={{ color: '#2563eb' }}>← Back</a>
        {site.vercel_url ? (
          <a href={`https://${site.vercel_url}`} target="_blank" rel="noreferrer" style={{ color: '#16a34a' }}>
            Open Live
          </a>
        ) : null}
      </div>
      <div
        style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}
        dangerouslySetInnerHTML={{ __html: site.html }}
      />
    </main>
  );
}
