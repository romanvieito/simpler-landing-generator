// app/dashboard/page.tsx
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

type Lead = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  site_title: string;
  site_id: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSites();
    fetchLeads();
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
      setLoadingSites(false);
    }
  }

  async function fetchLeads() {
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) return;
      const data = await res.json();
      setLeads(data.leads ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeads(false);
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
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-gray-600" style={{ maxWidth: '28rem', margin: '0 auto' }}>
                Sign in to view your sites and leads.
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
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <Link href="/" className="link">
                ← Back to Generator
              </Link>
            </div>

            {/* Sites Section */}
            <div style={{ marginBottom: '3rem' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
                <h2 className="text-xl font-semibold text-gray-900">My Sites</h2>
                <Link href="/sites" className="link text-sm">
                  View All Sites →
                </Link>
              </div>

              {loadingSites ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{ color: 'var(--color-gray-500)' }}>Loading your sites...</div>
                </div>
              ) : sites.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  {sites.slice(0, 6).map((s) => ( // Show only first 6 sites
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

            {/* Leads Section */}
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
                <h2 className="text-xl font-semibold text-gray-900">Recent Leads</h2>
              </div>

              {loadingLeads ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{ color: 'var(--color-gray-500)' }}>Loading your leads...</div>
                </div>
              ) : leads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ color: 'var(--color-gray-500)', fontSize: '1.125rem' }}>No leads yet</div>
                  <p className="text-gray-600" style={{ maxWidth: '28rem', margin: '0 auto' }}>
                    Contact submissions from your sites will appear here.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '1rem',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
                }}>
                  {leads.slice(0, 12).map((lead) => ( // Show only first 12 leads
                    <div key={lead.id} className="card" style={{
                      padding: '1.5rem',
                      transition: 'box-shadow var(--transition-fast)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900" style={{ fontSize: '1.125rem' }}>
                              {lead.name}
                            </h3>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                              {lead.email}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', textAlign: 'right' }}>
                            {new Date(lead.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                          <strong>Site:</strong> {lead.site_title || 'Untitled Site'}
                        </div>

                        <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)' }}>
                          <strong>Message:</strong>
                          <p className="mt-1 line-clamp-3">
                            {lead.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
