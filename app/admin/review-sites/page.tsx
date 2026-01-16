// app/admin/review-sites/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Site = {
  id: string;
  title: string | null;
  vercel_url: string | null;
  custom_domain?: string | null;
  created_at: string;
  description: string | null;
  user_id: string;
};

export default function AdminReviewSitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllSites();
  }, []);

  async function fetchAllSites() {
    try {
      const res = await fetch('/api/admin/sites');
      if (!res.ok) {
        throw new Error(`Failed to fetch sites: ${res.status}`);
      }
      const data = await res.json();
      setSites(data.sites ?? []);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">Loading all sites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-2xl mx-auto flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Error Loading Sites</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchAllSites}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container py-4 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">Review All Sites</h1>
                <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Admin view of all generated websites</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard"
                className="btn btn-ghost text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 md:px-4 py-2 rounded-lg transition-all duration-200 flex-shrink-0 text-sm md:text-base"
              >
                <svg className="w-4 h-4 mr-0 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden md:inline">Back to Dashboard</span>
                <span className="md:hidden">Back</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Generated Websites</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total: {sites.length} sites
            </p>
          </div>
          <button
            onClick={fetchAllSites}
            className="btn btn-ghost text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {sites.length === 0 ? (
          <div className="text-center py-16 space-y-6 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mx-auto flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">No sites found</h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                There are no websites in the database yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sites.map((site, index) => (
              <div
                key={site.id}
                className="card group hover:shadow-lg transition-all duration-300 animate-fade-in flex flex-col h-full"
                style={{ animationDelay: `${index * 50}ms` }}
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

                  {/* Description */}
                  <div className="mb-4 min-h-[2.5rem]">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {site.description || 'No description provided'}
                    </p>
                  </div>

                  {/* URL */}
                  {(site.custom_domain || site.vercel_url) && (
                    <div className="flex items-center text-xs text-gray-600 mb-2 min-w-0">
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="truncate">
                        {site.custom_domain || site.vercel_url}
                      </span>
                    </div>
                  )}

                  {/* User ID */}
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-mono">User: {site.user_id.slice(0, 8)}...</span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center text-xs text-gray-500 mb-6">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(site.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/sites/${site.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                        title="View site"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      {(site.custom_domain || site.vercel_url) && (
                        <a
                          href={site.custom_domain || site.vercel_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Visit live site"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}