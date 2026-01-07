// app/sites/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Site = {
  id: string;
  title: string | null;
  html: string;
  vercel_url: string | null;
  custom_domain?: string | null;
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-gray-50)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-gray-500)' }}>Loading site...</div>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-gray-50)' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 className="text-2xl font-semibold text-gray-900" style={{ marginBottom: '0.5rem' }}>Site not found</h1>
          <p className="text-gray-600" style={{ marginBottom: '1rem' }}>This site may have been deleted or doesn't exist.</p>
          <Link href="/sites" className="link">
            ← Back to My Sites
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: site.html }}
      style={{ width: '100%' }}
    />
  );
}
