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
  const [backUrl, setBackUrl] = useState('/dashboard');

  useEffect(() => {
    fetchSite();

    // Determine back URL based on referrer
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      if (referrer.includes('/sites') && !referrer.includes(`/sites/${id}`)) {
        // Came from sites list page
        setBackUrl('/sites');
      } else if (referrer.includes('/dashboard')) {
        // Came from dashboard
        setBackUrl('/dashboard');
      } else if (referrer.includes('/?loadSite=') || referrer.includes(window.location.origin + '/')) {
        // Came from main generator page, go back to editing this site
        setBackUrl(`/?loadSite=${id}`);
      } else if (referrer.includes(window.location.origin)) {
        // Came from another page on our site, go to dashboard
        setBackUrl('/dashboard');
      }
      // Default is already '/dashboard'
    }

    // Handle browser back button
    const handlePopState = (event: PopStateEvent) => {
      // If user presses back button, ensure we go to the right place
      if (event.state?.fromSitePage) {
        window.history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Push a state so browser back button works properly
    window.history.pushState({ fromSitePage: true }, '', window.location.href);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
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
    <>
      {/* Back button overlay */}
      <div className="fixed top-4 left-4 z-50 animate-fade-in">
        <Link
          href={backUrl}
          className="btn btn-ghost bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-gray-900"
          title={backUrl.includes('?loadSite=') ? 'Back to Editor' :
                  backUrl === '/sites' ? 'Back to My Sites' : 'Back to Dashboard'}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">
            {backUrl.includes('?loadSite=') ? 'Back to Editor' :
             backUrl === '/sites' ? 'Back to My Sites' : 'Back to Dashboard'}
          </span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      {/* Generated site content */}
      <div
        dangerouslySetInnerHTML={{ __html: site.html }}
        style={{ width: '100%' }}
      />
    </>
  );
}
