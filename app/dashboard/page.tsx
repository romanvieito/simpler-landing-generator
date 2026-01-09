// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UrlEditor from '@/components/url-editor';

type Site = {
  id: string;
  title: string | null;
  vercel_url: string | null;
  custom_domain?: string | null;
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
    router.push(`/?loadSite=${site.id}`);
  }

  async function handleUrlUpdate(siteId: string, newUrl: string) {
    // Update the site in the local state
    setSites(prevSites =>
      prevSites.map(site =>
        site.id === siteId
          ? { ...site, vercel_url: newUrl }
          : site
      )
    );
  }

  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
            <div className="space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                Sign in to access your sites and manage leads.
              </p>
            </div>
            <SignInButton mode="modal">
              <button className="btn btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
          {/* Modern Header */}
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <div className="container py-4 md:py-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">Dashboard</h1>
                    <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Manage your sites and leads</p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="btn btn-ghost text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 md:px-4 py-2 rounded-lg transition-all duration-200 flex-shrink-0 text-sm md:text-base"
                >
                  <svg className="w-4 h-4 mr-0 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="hidden md:inline">Back to Generator</span>
                  <span className="md:hidden">Back</span>
                </Link>
              </div>
            </div>
          </header>

          <main className="container py-8 md:py-12 space-y-12 md:space-y-16">
            {/* Sites Section */}
            <section className="space-y-6 md:space-y-8">
              <div className="flex items-start md:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Your Sites</h2>
                  <p className="text-sm md:text-base text-gray-600 mt-1">Manage and edit your landing pages</p>
                </div>
                <Link
                  href="/sites"
                  className="btn btn-ghost text-gray-600 hover:text-gray-900 px-3 md:px-4 py-2 rounded-lg transition-all duration-200 flex-shrink-0 text-sm md:text-base whitespace-nowrap"
                >
                  <span className="hidden sm:inline">View All</span>
                  <span className="sm:hidden">All</span>
                  <svg className="w-4 h-4 ml-1 md:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {loadingSites ? (
                <div className="flex items-center justify-center py-16">
                  <div className="spinner"></div>
                  <span className="ml-3 text-gray-600">Loading your sites...</span>
                </div>
              ) : sites.length === 0 ? (
                <div className="text-center py-16 space-y-6 animate-fade-in">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mx-auto flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-900">No sites yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                      Create your first landing page to get started with generating leads and growing your business.
                    </p>
                  </div>
                  <Link
                    href="/"
                    className="btn btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Your First Site
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sites.slice(0, 6).map((site, index) => (
                    <div
                      key={site.id}
                      className="card group hover:shadow-lg transition-all duration-300 animate-fade-in flex flex-col h-full"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="p-6 flex flex-col h-full">
                        {/* Header with title and status */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors duration-200 truncate">
                              {site.title || 'Untitled Site'}
                            </h3>
                          </div>
                          {site.vercel_url && (
                            <span className="status status-success text-xs flex-shrink-0 whitespace-nowrap">
                              Live
                            </span>
                          )}
                        </div>

                        {/* Description - fixed height */}
                        <div className="mb-4 min-h-[2.5rem]">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {site.description || 'No description provided'}
                          </p>
                        </div>

                        {/* URL */}
                        {(site.custom_domain || site.vercel_url) && (
                          <div className="flex items-center text-xs text-gray-600 mb-2">
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <UrlEditor
                              siteId={site.id}
                              currentUrl={site.custom_domain || site.vercel_url}
                              onUrlUpdate={(newUrl) => handleUrlUpdate(site.id, newUrl)}
                            />
                          </div>
                        )}

                        {/* Date */}
                        <div className="flex items-center text-xs text-gray-500 mb-6">
                          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(site.created_at).toLocaleDateString()}</span>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            {/* Left: Primary actions */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleLoadInEditor(site)}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>

                            {/* Right: Secondary actions */}
                            <div className="flex gap-1">
                              <a
                                href={`/sites/${site.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Site details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </a>
                              <button
                                onClick={() => handleDelete(site.id)}
                                disabled={deletingId === site.id}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete site"
                              >
                                {deletingId === site.id ? (
                                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Leads Section */}
            <section className="space-y-6 md:space-y-8">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recent Leads</h2>
                <p className="text-sm md:text-base text-gray-600 mt-1">Contact submissions from your sites</p>
              </div>

              {loadingLeads ? (
                <div className="flex items-center justify-center py-16">
                  <div className="spinner"></div>
                  <span className="ml-3 text-gray-600">Loading your leads...</span>
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-16 space-y-6 animate-fade-in">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mx-auto flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-900">No leads yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                      Once visitors submit contact forms on your sites, their information will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {leads.slice(0, 12).map((lead, index) => (
                    <div
                      key={lead.id}
                      className="card group hover:shadow-lg transition-all duration-300 animate-fade-in flex flex-col h-full"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="p-6 flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-lg truncate">
                              {lead.name}
                            </h3>
                            <a 
                              href={`mailto:${lead.email}`}
                              className="text-sm text-blue-600 hover:text-blue-700 hover:underline mt-1 block truncate"
                            >
                              {lead.email}
                            </a>
                          </div>
                          <div className="text-xs text-gray-500 text-right flex-shrink-0 whitespace-nowrap">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Site info */}
                        <div className="flex items-center text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
                          <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <span className="truncate">{lead.site_title || 'Untitled Site'}</span>
                        </div>

                        {/* Message - flexible height */}
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Message</div>
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                            {lead.message}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            {/* Left: Primary action */}
                            <a
                              href={`mailto:${lead.email}`}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Reply to lead"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </a>

                            {/* Right: Secondary action */}
                            <a
                              href={`/sites/${lead.site_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                              title="View source site"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </SignedIn>
    </>
  );
}
