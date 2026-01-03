// app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

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

export default function Page() {
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
      if (e.key === 'Delete' && selectedEl && container.contains(selectedEl)) {
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
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ marginBottom: 12 }}>Landing Generator</h1>
            <p style={{ marginBottom: 20 }}>Sign in to generate and publish landing pages.</p>
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
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 700 }}>Landing Generator</span>
              {status ? <span style={{ color: '#6b7280', fontSize: 13 }}>{status}</span> : null}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/sites" style={{ fontSize: 14, color: '#2563eb' }}>My Sites</Link>
              <UserButton />
            </div>
          </header>

          <main style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', padding: 16 }}>
            <section style={{ display: 'grid', gap: 12 }}>
              <label htmlFor="desc" style={{ fontWeight: 600 }}>Business / website description</label>
              <textarea
                id="desc"
                placeholder="Describe your business, audience, tone, unique value, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={handleGenerate}
                  disabled={!description || isGenerating}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: isGenerating ? '#f3f4f6' : 'black',
                    color: isGenerating ? '#6b7280' : 'white',
                    cursor: !description || isGenerating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>

                <button
                  onClick={() => setEditMode((v) => !v)}
                  disabled={!html || isGenerating}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: editMode ? '#ede9fe' : 'white',
                    color: 'black',
                    cursor: !html || isGenerating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
                </button>

                <button
                  onClick={doUndo}
                  disabled={history.length < 1}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: 'white',
                    color: history.length < 1 ? '#9ca3af' : 'black',
                    cursor: history.length < 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Undo
                </button>

                <button
                  onClick={handleSave}
                  disabled={!html || isGenerating}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: '#111827',
                    color: 'white',
                    cursor: !html || isGenerating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading === 'saving' ? 'Saving...' : savedSiteId ? 'Saved ✓' : 'Save'}
                </button>

                <button
                  onClick={handlePublish}
                  disabled={!html || isGenerating}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: '#16a34a',
                    color: 'white',
                    cursor: !html || isGenerating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading === 'publishing' ? 'Publishing...' : 'Publish'}
                </button>
              </div>

              {publishedUrl ? (
                <div
                  style={{
                    padding: 12,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: '#f0fdf4',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Published!</div>
                  <a href={`https://${publishedUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                    https://{publishedUrl}
                  </a>
                </div>
              ) : null}

              {savedSiteId ? (
                <div
                  style={{
                    padding: 12,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: '#eff6ff',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Saved</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link href="/sites" style={{ color: '#2563eb' }}>Go to My Sites</Link>
                    <Link href={`/sites/${savedSiteId}`} style={{ color: '#2563eb' }}>Open this site</Link>
                  </div>
                </div>
              ) : null}
            </section>

            <section style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontWeight: 600 }}>Preview</div>
              <div
                ref={previewRef}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  overflow: 'hidden',
                  minHeight: 300,
                  background: '#fff',
                }}
              />
              {!html && (
                <div style={{ color: '#6b7280', fontSize: 14 }}>
                  Your generated landing page preview will appear here.
                </div>
              )}
              {editMode && (
                <div style={{ color: '#6b7280', fontSize: 13 }}>
                  Edit mode tips: Click text to edit inline. Press Delete to remove a selected element. Use Cmd/Ctrl+Z or the Undo button to revert changes.
                </div>
              )}
            </section>
          </main>

          <footer style={{ padding: 16, color: '#6b7280', fontSize: 13 }}>
            <div>Mobile responsive HTML is generated using inline CSS for portability.</div>
          </footer>
        </div>
      </SignedIn>
    </>
  );
}
