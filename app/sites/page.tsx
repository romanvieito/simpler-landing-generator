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
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ marginBottom: 12 }}>My Sites</h1>
            <p style={{ marginBottom: 20 }}>Sign in to view your saved sites.</p>
            <SignInButton mode="modal">
              <button
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  background: 'black',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <main style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{ margin: 0 }}>My Sites</h1>
            <Link href="/" style={{ color: '#2563eb' }}>← Back to Generator</Link>
          </div>

          {loading ? (
            <div style={{ color: '#6b7280' }}>Loading...</div>
          ) : sites.length === 0 ? (
            <div style={{ color: '#6b7280' }}>No sites yet. Generate and Save your first site.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {sites.map((s) => (
                <div
                  key={s.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{s.title || 'Untitled'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {new Date(s.created_at).toLocaleString()}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: '#374151' }}>
                      {s.description || ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleLoadInEditor(s)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #e5e7eb',
                        background: '#f3f4f6',
                        color: '#111827',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      Load in Editor
                    </button>
                    <Link href={`/sites/${s.id}`} style={{ color: '#2563eb', fontSize: 13 }}>View</Link>
                    {s.vercel_url ? (
                      <a href={`https://${s.vercel_url}`} target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontSize: 13 }}>
                        Live
                      </a>
                    ) : null}
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #e5e7eb',
                        background: '#fef2f2',
                        color: '#dc2626',
                        cursor: deletingId === s.id ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                      }}
                    >
                      {deletingId === s.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </SignedIn>
    </>
  );
}
