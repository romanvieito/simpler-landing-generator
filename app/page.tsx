// app/page.tsx
'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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

  async function handleGenerate() {
    try {
      setLoading('planning');
      setPublishedUrl('');
      setSavedSiteId('');
      setPlan(null);
      setHtml('');
      setHistory([]);
      setSelectedEl(null);

      const planRes = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
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
      if (!htmlRes.ok) throw new Error('Failed to generate HTML');
      const { html: htmlOut } = await htmlRes.json();
      setHtml(htmlOut);
      setHistory([htmlOut]);
      setLoading('idle');
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
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: plan?.title ?? 'Landing',
          description,
          plan,
          html,
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

  async function handlePublish() {
    try {
      if (!html) {
        alert('No HTML to publish.');
        return;
      }
      setLoading('publishing');
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html,
          nameHint: plan?.title ?? 'landing',
          siteId: savedSiteId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Publish failed');
      setPublishedUrl(data.url);
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
                {status && (
                  <span style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-gray-500)',
                    backgroundColor: 'var(--color-gray-100)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px'
                  }}>
                    {status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Link href="/sites" className="link text-sm">
                  My Sites
                </Link>
                <UserButton />
              </div>
            </div>
          </header>

          <main className="container" style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                  placeholder="Describe your business, audience, tone, unique value proposition, and what you want your landing page to achieve..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="textarea"
                />
              </div>
              <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                <button
                  onClick={handleGenerate}
                  disabled={!description || isGenerating}
                  className="btn btn-primary"
                >
                  {isGenerating ? 'Generating...' : 'Generate Landing Page'}
                </button>

                <button
                  onClick={() => setEditMode((v) => !v)}
                  disabled={!html || isGenerating}
                  className={`btn ${editMode ? 'btn-secondary' : 'btn-ghost'}`}
                >
                  {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
                </button>

                <button
                  onClick={doUndo}
                  disabled={history.length < 1}
                  className="btn btn-ghost"
                >
                  Undo
                </button>

                <button
                  onClick={handleSave}
                  disabled={!html || isGenerating}
                  className={`btn ${savedSiteId ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {loading === 'saving' ? 'Saving...' : savedSiteId ? 'Saved ✓' : 'Save Draft'}
                </button>

                <button
                  onClick={handlePublish}
                  disabled={!html || isGenerating}
                  className="btn btn-success"
                >
                  {loading === 'publishing' ? 'Publishing...' : 'Publish Live'}
                </button>
              </div>

              {publishedUrl && (
                <div className="card" style={{
                  padding: '1rem',
                  backgroundColor: 'var(--color-success-bg)',
                  borderColor: 'var(--color-success)'
                }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                    <span className="status status-success">Published</span>
                  </div>
                  <a
                    href={`https://${publishedUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="link"
                    style={{ wordBreak: 'break-all' }}
                  >
                    https://{publishedUrl}
                  </a>
                </div>
              )}

              {savedSiteId && (
                <div className="card" style={{
                  padding: '1rem',
                  backgroundColor: 'var(--color-blue-50)',
                  borderColor: 'var(--color-blue-100)'
                }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                    <span className="status status-info">Saved</span>
                  </div>
                  <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                    <Link href="/sites" className="link text-sm">
                      Go to My Sites
                    </Link>
                    <Link href={`/sites/${savedSiteId}`} className="link text-sm">
                      View Saved Site
                    </Link>
                  </div>
                </div>
              )}
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
                {editMode && (
                  <span className="status status-info">Edit Mode</span>
                )}
              </div>
              <div
                ref={previewRef}
                className="card"
                style={{
                  minHeight: '400px',
                  backgroundColor: 'var(--color-white)',
                  borderColor: 'var(--color-gray-200)'
                }}
              />
              {!html && (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: 'var(--color-gray-500)'
                }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Ready to generate
                  </div>
                  <div>Your generated landing page preview will appear here.</div>
                </div>
              )}
              {editMode && (
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-gray-600)',
                  backgroundColor: 'var(--color-gray-50)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <strong>Edit mode tips:</strong> Click text to edit inline. Press Delete to remove a selected element. Use Cmd/Ctrl+Z or the Undo button to revert changes.
                </div>
              )}
            </section>
          </main>

          <footer style={{
            borderTop: '1px solid var(--color-gray-200)',
            backgroundColor: 'var(--color-white)'
          }}>
            <div className="container" style={{
              padding: '1.5rem',
              textAlign: 'center',
              fontSize: '0.875rem',
              color: 'var(--color-gray-500)'
            }}>
              Mobile responsive HTML is generated using inline CSS for portability.
            </div>
          </footer>
        </div>
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
