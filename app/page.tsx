// app/page.tsx
'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CreditDisplay } from '@/components/credit-display';
import { PurchaseCreditsModal } from '@/components/purchase-credits-modal';

type Plan = {
  title: string;
  palette: { primary: string; secondary: string; background: string; text: string; accent: string };
  fonts?: { heading?: string; body?: string };
  sections: Array<{
    type: 'hero' | 'features' | 'testimonials' | 'cta' | 'footer' | 'about' | 'pricing' | 'gallery' | string;
    heading?: string;
    subheading?: string;
    body?: string;
    items?: Array<{ title?: string; body?: string }>;
    cta?: { label: string; url?: string };
    imageQuery?: string;
    imageUrl?: string;
  }>;
  images?: Array<{ query: string; url: string }>;
};

function LandingGeneratorContent() {
  const searchParams = useSearchParams();
  const [description, setDescription] = useState('');
  const [websiteStyle, setWebsiteStyle] = useState<'Professional' | 'Creative' | 'Friendly' | 'Minimalist'>('Professional');
  const [loading, setLoading] = useState<'idle' | 'planning' | 'coding' | 'publishing' | 'saving'>('idle');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [html, setHtml] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [publishedUrl, setPublishedUrl] = useState<string>('');
  const [savedSiteId, setSavedSiteId] = useState<string>('');
  const [view, setView] = useState<'input' | 'preview'>('input');
  const [editingUrl, setEditingUrl] = useState<boolean>(false);
  const [customUrlSlug, setCustomUrlSlug] = useState<string>('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);


  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewRef.current && html) {
      previewRef.current.innerHTML = html;
    }
  }, [html]);

  // Load site from URL parameter on mount (for "Load in Editor" functionality)
  useEffect(() => {
    const loadSiteId = searchParams.get('loadSite');
    if (loadSiteId) {
      console.log('Loading site from URL parameter:', loadSiteId);
      fetchSiteForEditing(loadSiteId);
    }
  }, [searchParams]);

  // Handle Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success) {
      alert('Payment successful! Credits have been added to your account.');
      // Clear the URL parameters
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('success');
        window.history.replaceState({}, '', url.toString());
      }
    }

    if (canceled) {
      alert('Payment was canceled.');
      // Clear the URL parameters
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('canceled');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams]);

  async function fetchSiteForEditing(siteId: string) {
    try {
      const res = await fetch(`/api/sites/${siteId}`);
      if (!res.ok) throw new Error('Failed to fetch site data');
      const data = await res.json();
      const site = data.site;
      console.log('Fetched site data:', site);

      if (site.description) {
        setDescription(site.description);
      }
      if (site.plan) {
        setPlan(site.plan);
      }
      if (site.html) {
        setHtml(site.html);
        setHistory([site.html]);
        setView('input'); // Show input form when loading site for editing
      }
      if (site.vercel_url) {
        setPublishedUrl(site.vercel_url);
        // Extract slug from existing URL for editing
        const url = new URL(`https://${site.vercel_url}`);
        const slug = url.hostname.split('.')[0];
        setCustomUrlSlug(slug);
      }

      // Clear the URL parameter after loading
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('loadSite');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {
      console.error('Failed to load site:', e);
      alert('Failed to load site data');
    }
  }

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    function handleClick(e: MouseEvent) {
      if (!editMode) return;
      const target = e.target as HTMLElement;
      if (!target || target === container) return;

      if (selectedEl && selectedEl !== target) {
        selectedEl.style.outline = '';
        selectedEl.contentEditable = 'false';
      }
      setSelectedEl(target);
      target.style.outline = '2px dashed #7c3aed';

      const tag = target.tagName.toLowerCase();
      const nonEditableTags = new Set(['img', 'svg', 'a', 'button', 'input']);
      if (!nonEditableTags.has(tag)) {
        target.contentEditable = 'true';
        target.focus();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (!editMode) return;
      const metaOrCtrl = e.metaKey || e.ctrlKey;
      if (metaOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        doUndo();
        return;
      }
      if (e.key === 'Delete' && selectedEl && container && container.contains(selectedEl)) {
        e.preventDefault();
        pushHistory();
        selectedEl.remove();
        finalizeEdit();
      }
    }

    function handleBlur() {
      if (!editMode) return;
      pushHistory();
      finalizeEdit();
    }

    container.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown, true);
    container.addEventListener('blur', handleBlur, true);
    return () => {
      container.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown, true);
      container.removeEventListener('blur', handleBlur, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, selectedEl, html]);

  function pushHistory() {
    if (!previewRef.current) return;
    const current = previewRef.current.innerHTML;
    setHistory((h) => [...h, current]);
  }

  function doUndo() {
    if (history.length < 1) return;
    const latest = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setHtml(latest);
    if (selectedEl) {
      selectedEl.style.outline = '';
      selectedEl.contentEditable = 'false';
      setSelectedEl(null);
    }
  }

  function finalizeEdit() {
    if (!previewRef.current) return;
    const updated = previewRef.current.innerHTML;
    setHtml(updated);
  }

  function cleanHtmlForPublishing(html: string): string {
    // Create a temporary element to parse and clean the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Remove editing artifacts
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;

      // Remove outline styles added during editing (any outline property)
      if (htmlEl.style.outline) {
        htmlEl.style.outline = '';
      }

      // Remove contentEditable attribute
      if (el.hasAttribute('contenteditable')) {
        el.removeAttribute('contenteditable');
      }

      // Remove any empty style attributes
      if (el.getAttribute('style') === '') {
        el.removeAttribute('style');
      }
    });

    return tempDiv.innerHTML;
  }

  async function handleGenerate() {
    try {
      setLoading('planning');
      setPublishedUrl('');
      setSavedSiteId('');
      setPlan(null);
      setHtml('');
      setHistory([]);
      setSelectedEl(null);
      setEditingUrl(false);
      setCustomUrlSlug('');

      const planRes = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, style: websiteStyle }),
      });

      if (planRes.status === 402) {
        // Insufficient credits
        const errorData = await planRes.json();
        alert(`${errorData.error}\n\nOpening credit purchase options...`);
        setShowPurchaseModal(true);
        setLoading('idle');
        return;
      }

      if (!planRes.ok) throw new Error('Failed to generate design plan');
      const planJson = await planRes.json();
      const planOut: Plan = planJson.plan;
      setPlan(planOut);

      setLoading('coding');
      const htmlRes = await fetch('/api/generate-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planOut }),
      });

      if (htmlRes.status === 402) {
        // Insufficient credits
        const errorData = await htmlRes.json();
        alert(`${errorData.error}\n\nOpening credit purchase options...`);
        setShowPurchaseModal(true);
        setLoading('idle');
        return;
      }

      if (!htmlRes.ok) throw new Error('Failed to generate HTML');
      const { html: htmlOut } = await htmlRes.json();
      setHtml(htmlOut);
      setHistory([htmlOut]);
      setLoading('idle');
      setView('preview');
    } catch (err) {
      console.error(err);
      setLoading('idle');
      alert((err as Error)?.message ?? 'Error generating page');
    }
  }

  async function handleSave() {
    try {
      if (!html) return alert('Generate the page first.');
      setLoading('saving');
      const cleanedHtml = cleanHtmlForPublishing(html);
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: plan?.title ?? 'Landing',
          description,
          plan,
          html: cleanedHtml,
          vercelUrl: publishedUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save failed');
      setSavedSiteId(data.id);
    } catch (e) {
      console.error(e);
      alert((e as Error)?.message ?? 'Error saving');
    } finally {
      setLoading('idle');
    }
  }

  async function handlePublish(urlSlug?: string) {
    try {
      if (!html) {
        alert('No HTML to publish.');
        return;
      }
      setLoading('publishing');
      const cleanedHtml = cleanHtmlForPublishing(html);
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: cleanedHtml,
          nameHint: urlSlug || customUrlSlug || plan?.title || 'landing',
          siteId: savedSiteId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Publish failed');
      setPublishedUrl(data.url);

      // Extract and set the slug from the published URL for future editing
      if (data.url && !customUrlSlug) {
        const url = new URL(`https://${data.url}`);
        const slug = url.hostname.split('.')[0];
        setCustomUrlSlug(slug);
      }

      // If we're republishing with a new slug, update the customUrlSlug
      if (urlSlug) {
        setCustomUrlSlug(urlSlug);
      }

      setEditingUrl(false);
    } catch (e) {
      console.error(e);
      alert((e as Error)?.message ?? 'Error publishing');
    } finally {
      setLoading('idle');
    }
  }

  const isGenerating = loading === 'planning' || loading === 'coding';
  const status = loading === 'planning'
    ? 'Step 1/2: Generating design plan...'
    : loading === 'coding'
      ? 'Step 2/2: Generating HTML...'
      : loading === 'publishing'
        ? 'Publishing to Vercel...'
        : loading === 'saving'
          ? 'Saving...'
          : '';

  return (
    <>
      <PurchaseCreditsModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />

      <SignedOut>
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-white)' }}>
          {/* Hero Section */}
          <section className="gradient-hero" style={{ 
            position: 'relative',
            padding: '5rem 1rem',
            overflow: 'hidden'
          }}>
            <div className="container" style={{ 
              maxWidth: '1200px',
              margin: '0 auto',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2rem'
              }}>
                <h1 style={{
                  fontSize: '3rem',
                  fontWeight: 700,
                  color: 'var(--color-white)',
                  lineHeight: 1.1,
                  maxWidth: '900px',
                  margin: '0 auto'
                }} className="md:text-6xl">
                  Quick, high-converting landing pages without the wait.
                </h1>
                <p style={{
                  fontSize: '1.25rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  maxWidth: '600px',
                  lineHeight: 1.6
                }}>
                  No coding. No design skills. Just describe your business and get a quick, 
                  high-converting landing page ready to publish.
                </p>
                <SignInButton mode="modal">
                  <button className="btn" style={{
                    backgroundColor: 'var(--color-white)',
                    color: '#667eea',
                    padding: '1rem 2.5rem',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                    border: 'none'
                  }}>
                    Start Creating for Free
                  </button>
                </SignInButton>
              </div>
            </div>
            {/* Decorative gradient overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              pointerEvents: 'none'
            }} />
          </section>

          {/* Who Is This For Section */}
          <section style={{ 
            padding: '5rem 1rem',
            backgroundColor: 'var(--color-gray-50)'
          }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--color-gray-900)',
                  marginBottom: '1rem'
                }}>
                  Who Is This For?
                </h2>
                <p style={{
                  fontSize: '1.125rem',
                  color: 'var(--color-gray-600)',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  EasyLand is perfect for creator who needs a quick landing page that converts.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2rem'
              }}>
                {/* Startup Founders */}
                <div className="card" style={{
                  padding: '2rem',
                  textAlign: 'center',
                  transition: 'transform var(--transition-base), box-shadow var(--transition-base)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.1)';
                  const icon = e.currentTarget.querySelector('.icon-circle') as HTMLElement;
                  if (icon) {
                    icon.style.transform = 'scale(1.1)';
                    icon.style.boxShadow = icon.style.boxShadow.replace('0.3', '0.5');
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                  const icon = e.currentTarget.querySelector('.icon-circle') as HTMLElement;
                  if (icon) {
                    icon.style.transform = 'scale(1)';
                    icon.style.boxShadow = icon.style.boxShadow.replace('0.5', '0.3');
                  }
                }}>
                  <div className="icon-circle" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                    transform: 'scale(1)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                      <path d="M12 16L13.09 22.26L22 23L13.09 23.74L12 30L10.91 23.74L2 23L10.91 22.26L12 16Z" fill="currentColor" opacity="0.6"/>
                    </svg>
                  </div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--color-gray-900)',
                    marginBottom: '0.75rem'
                  }}>
                    Creators
                  </h3>
                  <p style={{
                    color: 'var(--color-gray-600)',
                    lineHeight: 1.6
                  }}>
                    Launch your MVP landing page quickly to validate ideas and start collecting leads
                  </p>
                </div>

                {/* Freelancers & Agencies */}
                <div className="card" style={{
                  padding: '2rem',
                  textAlign: 'center',
                  transition: 'transform var(--transition-base), box-shadow var(--transition-base)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.1)';
                  const icon = e.currentTarget.querySelector('.icon-circle') as HTMLElement;
                  if (icon) {
                    icon.style.transform = 'scale(1.1)';
                    icon.style.boxShadow = icon.style.boxShadow.replace('0.3', '0.5');
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                  const icon = e.currentTarget.querySelector('.icon-circle') as HTMLElement;
                  if (icon) {
                    icon.style.transform = 'scale(1)';
                    icon.style.boxShadow = icon.style.boxShadow.replace('0.5', '0.3');
                  }
                }}>
                  <div className="icon-circle" style={{
                    background: 'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)',
                    color: 'white',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 8px 25px rgba(118, 75, 162, 0.3)',
                    transform: 'scale(1)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 7H16V5C16 3.89 15.11 3 14 3H10C8.89 3 8 3.89 8 5V7H4C2.89 7 2.01 7.89 2.01 9L2 19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V9C22 7.89 21.11 7 20 7ZM14 5V7H10V5H14ZM4 9H20V19H4V9Z" fill="currentColor"/>
                      <path d="M14 12H16V14H14V12Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--color-gray-900)',
                    marginBottom: '0.75rem'
                  }}>
                    Freelancers & Agencies
                  </h3>
                  <p style={{
                    color: 'var(--color-gray-600)',
                    lineHeight: 1.6
                  }}>
                    Deliver client landing pages faster and focus on strategy instead of coding
                  </p>
                </div>

                {/* Marketing Teams */}
                <div className="card" style={{
                  padding: '2rem',
                  textAlign: 'center',
                  transition: 'transform var(--transition-base), box-shadow var(--transition-base)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.1)';
                  const icon = e.currentTarget.querySelector('.icon-circle') as HTMLElement;
                  if (icon) {
                    icon.style.transform = 'scale(1.1)';
                    icon.style.boxShadow = icon.style.boxShadow.replace('0.3', '0.5');
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                  const icon = e.currentTarget.querySelector('.icon-circle') as HTMLElement;
                  if (icon) {
                    icon.style.transform = 'scale(1)';
                    icon.style.boxShadow = icon.style.boxShadow.replace('0.5', '0.3');
                  }
                }}>
                  <div className="icon-circle" style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                    color: 'white',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                    transform: 'scale(1)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--color-gray-900)',
                    marginBottom: '0.75rem'
                  }}>
                    Marketing Teams
                  </h3>
                  <p style={{
                    color: 'var(--color-gray-600)',
                    lineHeight: 1.6
                  }}>
                    Create campaign-specific landing pages without waiting for developers
                  </p>
                </div>

                {/* Small Business Owners */}
                <div className="card" style={{
                  padding: '2rem',
                  textAlign: 'center',
                  transition: 'transform var(--transition-base), box-shadow var(--transition-base)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.1)';
                  const icon = e.currentTarget.querySelector('.icon-circle') as HTMLElement;
                  if (icon) {
                    icon.style.transform = 'scale(1.1)';
                    icon.style.boxShadow = icon.style.boxShadow.replace('0.3', '0.5');
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                  const icon = e.currentTarget.querySelector('.icon-circle') as HTMLElement;
                  if (icon) {
                    icon.style.transform = 'scale(1)';
                    icon.style.boxShadow = icon.style.boxShadow.replace('0.5', '0.3');
                  }
                }}>
                  <div className="icon-circle" style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                    transform: 'scale(1)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 7H18V6C18 5.45 17.55 5 17 5S16 5.45 16 6V7H8V6C8 5.45 7.55 5 7 5S6 5.45 6 6V7H5C3.89 7 3.01 7.89 3.01 9L3 19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V9C21 7.89 20.11 7 19 7ZM5 19V9H19V19H5Z" fill="currentColor"/>
                      <path d="M9 11H11V13H9V11ZM13 11H15V13H13V11Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--color-gray-900)',
                    marginBottom: '0.75rem'
                  }}>
                    Small Business Owners
                  </h3>
                  <p style={{
                    color: 'var(--color-gray-600)',
                    lineHeight: 1.6
                  }}>
                    Get a professional online presence without breaking the bank or hiring developers
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Before & After Section */}
          <section style={{ 
            padding: '5rem 1rem',
            backgroundColor: 'var(--color-white)'
          }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--color-gray-900)',
                  marginBottom: '1rem'
                }}>
                  The Old Way vs. The EasyLand Way
                </h2>
                <p style={{
                  fontSize: '1.125rem',
                  color: 'var(--color-gray-600)',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  Stop wasting time and money on outdated solutions
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '3rem',
                maxWidth: '1000px',
                margin: '0 auto'
              }}>
                {/* Before - The Old Way */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-error-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      ❌
                    </div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: 'var(--color-gray-900)'
                    }}>
                      The Old Way
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="comparison-item comparison-item-before">
                      <span style={{ fontSize: '1.25rem', color: 'var(--color-error)', flexShrink: 0 }}>✗</span>
                      <span style={{ color: 'var(--color-gray-700)', lineHeight: 1.6 }}>
                        Hire a freelance developer and wait weeks for results
                      </span>
                    </div>
                    <div className="comparison-item comparison-item-before">
                      <span style={{ fontSize: '1.25rem', color: 'var(--color-error)', flexShrink: 0 }}>✗</span>
                      <span style={{ color: 'var(--color-gray-700)', lineHeight: 1.6 }}>
                        Learn to code or struggle with WordPress/CMS/Shopify
                      </span>
                    </div>
                    <div className="comparison-item comparison-item-before">
                      <span style={{ fontSize: '1.25rem', color: 'var(--color-error)', flexShrink: 0 }}>✗</span>
                      <span style={{ color: 'var(--color-gray-700)', lineHeight: 1.6 }}>
                        Pay thousands to an expensive agency
                      </span>
                    </div>
                    <div className="comparison-item comparison-item-before">
                      <span style={{ fontSize: '1.25rem', color: 'var(--color-error)', flexShrink: 0 }}>✗</span>
                      <span style={{ color: 'var(--color-gray-700)', lineHeight: 1.6 }}>
                        Struggle with outdated, clunky no-code tools
                      </span>
                    </div>
                  </div>
                </div>

                {/* After - With EasyLand */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-success-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      ✨
                    </div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: 'var(--color-gray-900)'
                    }}>
                      With EasyLand
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="comparison-item comparison-item-after">
                      <span style={{ fontSize: '1.25rem', color: 'var(--color-success)', flexShrink: 0 }}>✓</span>
                      <span style={{ color: 'var(--color-gray-900)', fontWeight: 500, lineHeight: 1.6 }}>
                        Quick, high-converting landing pages
                      </span>
                    </div>
                    <div className="comparison-item comparison-item-after">
                      <span style={{ fontSize: '1.25rem', color: 'var(--color-success)', flexShrink: 0 }}>✓</span>
                      <span style={{ color: 'var(--color-gray-900)', fontWeight: 500, lineHeight: 1.6 }}>
                        No coding or design skills required
                      </span>
                    </div>
                    <div className="comparison-item comparison-item-after">
                      <span style={{ fontSize: '1.25rem', color: 'var(--color-success)', flexShrink: 0 }}>✓</span>
                      <span style={{ color: 'var(--color-gray-900)', fontWeight: 500, lineHeight: 1.6 }}>
                        Affordable, pay-per-use pricing
                      </span>
                    </div>
                    <div className="comparison-item comparison-item-after">
                      <span style={{ fontSize: '1.25rem', color: 'var(--color-success)', flexShrink: 0 }}>✓</span>
                      <span style={{ color: 'var(--color-gray-900)', fontWeight: 500, lineHeight: 1.6 }}>
                        Test your ideas quickly
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final CTA */}
              <div className="text-center mt-16 py-12 px-4 sm:px-8 bg-gray-50 rounded-3xl">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  How Can I Test My Ideas in Minutes?
                </h3>
                <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
                  Get high-converting landing pages without the wait.
                </p>
                <SignInButton mode="modal">
                  <button className="btn btn-primary text-base sm:text-lg px-6 sm:px-10 py-3 sm:py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                    Start Creating for Free
                  </button>
                </SignInButton>
              </div>
            </div>
          </section>
        </div>
      </SignedOut>

      <SignedIn>
        {view === 'input' ? (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-gray-50)' }}>
            {/* Modern Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10 shadow-sm">
              <div className="container py-4 md:py-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">EasyLand</h1>
                      <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Landing Page Generator</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <div className="hidden sm:block flex-shrink-0">
                      <CreditDisplay onPurchaseClick={() => setShowPurchaseModal(true)} />
                    </div>

                    <Link href="/dashboard" className="btn btn-ghost text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 md:px-4 py-2 rounded-lg transition-all duration-200 flex-shrink-0 text-sm md:text-base hidden sm:inline-flex">
                      <svg className="w-4 h-4 mr-0 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="hidden md:inline">Dashboard</span>
                    </Link>
                    <div className="flex-shrink-0">
                      <UserButton />
                    </div>
                  </div>
                </div>
                {/* Mobile credit display */}
                <div className="sm:hidden mt-3">
                  <CreditDisplay onPurchaseClick={() => setShowPurchaseModal(true)} />
                </div>
              </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
              <div className="w-full max-w-2xl flex flex-col gap-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                    Create Landing Page
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Describe your business and generate a high-converting landing page
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      id="desc"
                      placeholder="Describe your business and audience..."
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        // Auto-resize textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
                      }}
                      rows={6}
                      className="textarea"
                      style={{
                        fontSize: '1rem',
                        paddingBottom: '3.5rem',
                        resize: 'none',
                        minHeight: '150px',
                        maxHeight: '300px',
                        overflow: 'auto'
                      }}
                    />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                      <select
                        value={websiteStyle}
                        onChange={(e) => setWebsiteStyle(e.target.value as 'Professional' | 'Creative' | 'Friendly' | 'Minimalist')}
                        className="select text-sm py-1.5 px-3 flex-1 max-w-48"
                      >
                        <option value="Professional">Professional</option>
                        <option value="Creative">Creative</option>
                        <option value="Friendly">Friendly</option>
                        <option value="Minimalist">Minimalist</option>
                      </select>
                      <button
                        onClick={handleGenerate}
                        disabled={!description || isGenerating}
                        className="btn btn-primary p-2 w-10 h-10 flex items-center justify-center flex-shrink-0"
                        title={isGenerating ? 'Generating...' : 'Generate Landing Page'}
                      >
                        {isGenerating ? (
                          <div className="spinner w-4 h-4" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 14l5-5 5 5z" fill="currentColor"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {status && (
                  <div className="text-center mt-4">
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {status}
                    </span>
                  </div>
                )}
              </div>
            </main>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-white)' }}>
            <header style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              backgroundColor: 'var(--color-white)',
              borderBottom: '1px solid var(--color-gray-200)',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
            }}>
              <div className="container flex items-center justify-between" style={{ padding: '0.75rem 0' }}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setView('input');
                      setEditMode(false);
                      if (selectedEl) {
                        selectedEl.style.outline = '';
                        selectedEl.contentEditable = 'false';
                        setSelectedEl(null);
                      }
                    }}
                    className="btn btn-ghost"
                    style={{ padding: '0.5rem 0.75rem' }}
                  >
                    ← Edit Prompt
                  </button>
                  <div style={{
                    height: '1.5rem',
                    width: '1px',
                    backgroundColor: 'var(--color-gray-300)'
                  }} />
                  <Link href="/sites" className="link text-sm">
                    My Sites
                  </Link>
                </div>

                <div className="flex items-center gap-3">
                  <CreditDisplay onPurchaseClick={() => setShowPurchaseModal(true)} />

                  <button
                    onClick={() => setEditMode((v) => !v)}
                    disabled={!html || isGenerating}
                    className={`btn ${editMode ? 'btn-secondary' : 'btn-ghost'}`}
                    style={{ padding: '0.5rem 0.75rem' }}
                  >
                    {editMode ? '✓ Edit Mode' : 'Edit Text'}
                  </button>

                  <button
                    onClick={doUndo}
                    disabled={history.length < 1}
                    className="btn btn-ghost"
                    style={{ padding: '0.5rem 0.75rem' }}
                    title="Undo (Cmd/Ctrl+Z)"
                  >
                    ↶
                  </button>

                  <div style={{ 
                    height: '1.5rem', 
                    width: '1px', 
                    backgroundColor: 'var(--color-gray-300)' 
                  }} />

                  <button
                    onClick={handleSave}
                    disabled={!html || isGenerating}
                    className={`btn ${savedSiteId ? 'btn-secondary' : 'btn-ghost'}`}
                    style={{ padding: '0.5rem 0.75rem' }}
                  >
                    {loading === 'saving' ? 'Saving...' : savedSiteId ? 'Saved ✓' : 'Save Draft'}
                  </button>

                  <button
                    onClick={() => handlePublish()}
                    disabled={!html || isGenerating}
                    className="btn btn-success"
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    {loading === 'publishing' ? 'Publishing...' : 'Publish Live'}
                  </button>

                  <div style={{ 
                    height: '1.5rem', 
                    width: '1px', 
                    backgroundColor: 'var(--color-gray-300)' 
                  }} />

                  <UserButton />
                </div>
              </div>

              {(publishedUrl || savedSiteId) && (
                <div className="bg-gray-50 border-t border-gray-200 py-2">
                  <div className="container flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                    {publishedUrl && (
                      <div className="flex items-center gap-2">
                        <span className="status status-success" style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem' }}>
                          Published
                        </span>
                        {editingUrl ? (
                          <div className="flex items-center gap-2">
                            <span style={{ color: 'var(--color-gray-600)' }}>
                              https://
                            </span>
                            <input
                              type="text"
                              value={customUrlSlug}
                              onChange={(e) => setCustomUrlSlug(e.target.value)}
                              className="input"
                              style={{
                                fontSize: '0.875rem',
                                padding: '0.25rem 0.5rem',
                                width: '120px',
                                height: 'auto'
                              }}
                              placeholder="url-slug"
                            />
                            <span style={{ color: 'var(--color-gray-600)' }}>
                              .vercel.app
                            </span>
                            <button
                              onClick={() => handlePublish(customUrlSlug)}
                              disabled={!customUrlSlug.trim() || loading === 'publishing'}
                              className="btn btn-primary"
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                height: 'auto'
                              }}
                            >
                              {loading === 'publishing' ? '...' : 'Update'}
                            </button>
                            <button
                              onClick={() => setEditingUrl(false)}
                              className="btn btn-ghost"
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                height: 'auto'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://${publishedUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="link text-sm"
                            >
                              {publishedUrl}
                            </a>
                            <button
                              onClick={() => setEditingUrl(true)}
                              className="btn btn-ghost"
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.125rem 0.25rem',
                                height: 'auto'
                              }}
                              title="Edit URL"
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {savedSiteId && !publishedUrl && (
                      <div className="flex items-center gap-2">
                        <span className="status status-info" style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem' }}>
                          Saved
                        </span>
                        <Link href={`/sites/${savedSiteId}`} className="link text-sm">
                          View in My Sites
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </header>

            <main style={{ 
              flex: 1,
              overflow: 'auto',
              backgroundColor: 'var(--color-gray-50)'
            }}>
              <div
                ref={previewRef}
                style={{
                  minHeight: '100%',
                  backgroundColor: 'var(--color-white)'
                }}
              />
              {editMode && (
                <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-50">
                  <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300 shadow-lg max-w-sm sm:max-w-md mx-auto">
                    <div className="text-sm text-gray-700 text-center sm:text-left">
                      <strong>Edit mode:</strong>
                      <div className="mt-1 space-y-1 sm:hidden">
                        <div>• Tap text to edit</div>
                        <div>• Long press to delete</div>
                        <div>• Undo with ↶</div>
                      </div>
                      <div className="hidden sm:block">
                        Click text to edit • Press Delete to remove • Cmd/Ctrl+Z to undo
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </SignedIn>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </div>
    }>
      <LandingGeneratorContent />
    </Suspense>
  );
}
