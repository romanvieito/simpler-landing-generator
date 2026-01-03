// app/sites/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Site = {
  id: string;
  title: string | null;
  vercel_url: string | null;
  created_at: string;
  description: string | null;
};

export default function SitesPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSites();
  }, []);

  async function fetchSites() {
    try {
      const res = await fetch('/api/sites');
      if (!res.ok) return;
      const data = await res.json();
      setSites(data.sites ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this site?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/sites/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSites((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  }

  function handleLoadInEditor(site: Site) {
    // Navigate to main page with site ID as query parameter
    router.push(`/?loadSite=${site.id}`);
  }

  return (
    <>
      <SignedOut>
        <div className="container flex items-center justify-center" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
          <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h1 className="text-2xl font-semibold text-gray-900">My Sites</h1>
              <p className="text-gray-600" style={{ maxWidth: '28rem', margin: '0 auto' }}>
                Sign in to view and manage your saved landing pages.
              </p>
            </div>
            <SignInButton mode="modal">
              <button className="btn btn-primary">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-50)' }}>
          <div className="container" style={{ padding: '2rem 0' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
              <h1 className="text-2xl font-semibold text-gray-900">My Sites</h1>
              <Link href="/" className="link">
                ← Back to Generator
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ color: 'var(--color-gray-500)' }}>Loading your sites...</div>
              </div>
            ) : sites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ color: 'var(--color-gray-500)', fontSize: '1.125rem' }}>No sites yet</div>
                <p className="text-gray-600" style={{ maxWidth: '28rem', margin: '0 auto' }}>
                  Generate and save your first landing page to see it here.
                </p>
                <Link href="/" className="btn btn-primary">
                  Create Your First Site
                </Link>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '1rem',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
              }}>
                {sites.map((s) => (
                  <div key={s.id} className="card" style={{
                    padding: '1.5rem',
                    transition: 'box-shadow var(--transition-fast)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 truncate" style={{ fontSize: '1.125rem' }}>
                          {s.title || 'Untitled Site'}
                        </h3>
                        {s.vercel_url && (
                          <span className="status status-success" style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>Live</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                        {new Date(s.created_at).toLocaleDateString()}
                      </div>
                      {s.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {s.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleLoadInEditor(s)}
                        className="btn btn-secondary text-xs px-3 py-1.5"
                      >
                        Load in Editor
                      </button>
                      <Link
                        href={`/sites/${s.id}`}
                        className="link text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        View
                      </Link>
                      {s.vercel_url && (
                        <a
                          href={`https://${s.vercel_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="link text-success text-xs px-3 py-1.5 border border-green-300 rounded-md hover:bg-green-50"
                        >
                          Live Site
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="btn btn-danger text-xs px-3 py-1.5"
                      >
                        {deletingId === s.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SignedIn>
    </>
  );
}
