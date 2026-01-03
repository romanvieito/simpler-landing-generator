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
        body: JSON.stringify({ description }),
      });

      if (planRes.status === 402) {
        // Insufficient credits
        const errorData = await planRes.json();
        alert(errorData.error);
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
        alert(errorData.error);
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
      <SignedOut>
        <div className="container flex items-center justify-center" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
          <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h1 className="text-2xl font-semibold text-gray-900">Landing Generator</h1>
              <p className="text-gray-600" style={{ maxWidth: '28rem', margin: '0 auto' }}>
                Create and publish landing pages with AI. Sign in to get started.
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
        {view === 'input' ? (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-gray-50)' }}>
            <header style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              backgroundColor: 'var(--color-white)',
              borderBottom: '1px solid var(--color-gray-200)'
            }}>
              <div className="container flex items-center justify-between" style={{ padding: '0.75rem 0' }}>
                <div className="flex items-center gap-4">
                  <h1 className="text-lg font-semibold text-gray-900">Landing Generator</h1>
                </div>
                <div className="flex items-center gap-4">
                  <CreditDisplay onPurchaseClick={() => setShowPurchaseModal(true)} />
                  <Link href="/sites" className="link text-sm">
                    My Sites
                  </Link>
                  <UserButton />
                </div>
              </div>
            </header>

            <main style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '2rem 1rem'
            }}>
              <div style={{ 
                width: '100%', 
                maxWidth: '42rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <h2 className="text-2xl font-semibold text-gray-900" style={{ marginBottom: '0.5rem' }}>
                    Create Your Landing Page
                  </h2>
                  <p className="text-gray-600">
                    Describe your business and we&apos;ll generate a beautiful landing page for you
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="desc" style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--color-gray-900)'
                  }}>
                    Business / website description
                  </label>
                  <textarea
                    id="desc"
                    placeholder="Describe your business, audience, and value proposition..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="textarea"
                    style={{ fontSize: '1rem' }}
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!description || isGenerating}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                >
                  {isGenerating ? 'Generating...' : 'Generate Landing Page'}
                </button>

                {status && (
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <span style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-gray-500)',
                      backgroundColor: 'var(--color-gray-100)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px'
                    }}>
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
                <div style={{
                  backgroundColor: 'var(--color-gray-50)',
                  borderTop: '1px solid var(--color-gray-200)',
                  padding: '0.5rem 0'
                }}>
                  <div className="container flex items-center gap-4" style={{ fontSize: '0.875rem' }}>
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
                <div style={{
                  position: 'fixed',
                  bottom: '1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.875rem',
                  color: 'var(--color-gray-700)',
                  backgroundColor: 'var(--color-white)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-gray-300)',
                  boxShadow: 'var(--shadow-lg)',
                  maxWidth: '90%',
                  zIndex: 5
                }}>
                  <strong>Edit mode:</strong> Click text to edit • Press Delete to remove • Cmd/Ctrl+Z to undo
                </div>
              )}
            </main>
          </div>
        )}
      </SignedIn>

      <PurchaseCreditsModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />
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
