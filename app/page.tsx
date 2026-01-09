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
  sectionsContent: {
    hero: {
      headline: string;
      subhead: string;
      primaryCta: string;
    };
    audience: {
      title: string;
      description: string;
    };
    contact: {
      title: string;
      nameLabel: string;
      emailLabel: string;
      messageLabel: string;
      submitLabel: string;
    };
  };
  images?: Array<{ query: string; url: string }>;
};

type DraftSnapshot = {
  description: string;
  websiteStyle: 'Professional' | 'Creative' | 'Friendly' | 'Minimalist';
  loading: 'idle' | 'planning' | 'coding' | 'publishing' | 'saving';
  plan: Plan | null;
  planDetails: { title?: string; sectionCount?: number; sections?: string[]; style?: string; palette?: any; fonts?: any; imageQueries?: string[] } | null;
  html: string;
  history: string[];
  redoStack?: string[];
  publishedUrl: string;
  savedSiteId: string;
  view: 'input' | 'preview';
  editMode: boolean;
  editingUrl: boolean;
  customUrlSlug: string;
};

type DraftPayloadV1 = {
  version: 1;
  updatedAt: number;
  snapshot: DraftSnapshot;
};

function readDraft(key: string): DraftPayloadV1 | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPayloadV1;
    if (!parsed || parsed.version !== 1 || !parsed.snapshot) return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeWriteDraft(key: string, payload: DraftPayloadV1) {
  if (typeof window === 'undefined') return;
  try {
    const json = JSON.stringify(payload);
    // Avoid blowing up localStorage quota if HTML is huge.
    if (json.length > 4_500_000) return;
    window.localStorage.setItem(key, json);
  } catch {
    // ignore (quota / private mode / etc.)
  }
}

function clearSearchParam(param: string) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete(param);
    window.history.replaceState({}, '', url.toString());
  } catch {
    // ignore
  }
}

function LandingGeneratorContent() {
  const searchParams = useSearchParams();
  const [description, setDescription] = useState('');
  const [websiteStyle, setWebsiteStyle] = useState<'Professional' | 'Creative' | 'Friendly' | 'Minimalist'>('Professional');
  const [loading, setLoading] = useState<'idle' | 'planning' | 'coding' | 'publishing' | 'saving'>('idle');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planDetails, setPlanDetails] = useState<{ title?: string; sectionCount?: number; sections?: string[]; style?: string; palette?: any; fonts?: any; imageQueries?: string[] } | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [html, setHtml] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);
  const selectedElRef = useRef<HTMLElement | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [publishedUrl, setPublishedUrl] = useState<string>('');
  const [savedSiteId, setSavedSiteId] = useState<string>('');
  const [view, setView] = useState<'input' | 'preview'>('input');
  const [editingUrl, setEditingUrl] = useState<boolean>(false);
  const [customUrlSlug, setCustomUrlSlug] = useState<string>('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const loadSiteIdFromUrl = searchParams.get('loadSite');
  const activeDraftKey = loadSiteIdFromUrl
    ? `easyland:draft:v1:site:${loadSiteIdFromUrl}`
    : savedSiteId
      ? `easyland:draft:v1:site:${savedSiteId}`
      : 'easyland:draft:v1:last';

  // Detailed status messages for each phase
  const planningMessages = [
    'Step 1/2: Analyzing your business description...',
    'Step 1/2: Understanding your target audience...',
    'Step 1/2: Planning content structure and sections...',
    'Step 1/2: Designing color palette and visual theme...',
    'Step 1/2: Selecting typography and fonts...',
    'Step 1/2: Finding relevant images and visuals...',
    'Step 1/2: Creating comprehensive design plan...'
  ];

  const codingMessages = [
    'Step 2/2: Generating responsive HTML structure...',
    'Step 2/2: Applying custom CSS styles and colors...',
    'Step 2/2: Implementing mobile-first design...',
    'Step 2/2: Adding interactive elements and animations...',
    'Step 2/2: Optimizing for performance and speed...',
    'Step 2/2: Finalizing responsive breakpoints...',
    'Step 2/2: Adding smooth hover effects and transitions...',
    'Step 2/2: Ensuring cross-browser compatibility...',
    'Step 2/2: Implementing accessibility features...',
    'Step 2/2: Completing landing page generation...'
  ];

  // Detailed coding phase messages that cycle through different aspects
  const getDetailedCodingMessage = (index: number) => {
    if (!planDetails) return codingMessages[index % codingMessages.length];

    const cycleIndex = index % 6; // Cycle through 6 different detailed messages

    switch (cycleIndex) {
      case 0:
        return planDetails.title && planDetails.sectionCount
          ? `Step 2/2: Building "${planDetails.title}" with ${planDetails.sectionCount} sections (${planDetails.sections?.slice(0, 3).join(', ')}${planDetails.sections && planDetails.sections.length > 3 ? '...' : ''})`
          : codingMessages[index % codingMessages.length];
      case 1:
        return planDetails.palette?.primary && planDetails.palette?.secondary
          ? `Step 2/2: Applying ${planDetails.palette.primary} primary and ${planDetails.palette.secondary} accent colors`
          : codingMessages[index % codingMessages.length];
      case 2:
        return planDetails.fonts?.heading && planDetails.fonts?.body
          ? `Step 2/2: Setting up ${planDetails.fonts.heading} headings and ${planDetails.fonts.body} body text`
          : codingMessages[index % codingMessages.length];
      case 3:
        return planDetails.imageQueries?.length
          ? `Step 2/2: Finding ${planDetails.imageQueries.length} high-quality images (${planDetails.imageQueries.slice(0, 2).join(', ')}${planDetails.imageQueries.length > 2 ? '...' : ''})`
          : codingMessages[index % codingMessages.length];
      case 4:
        const sectionsList = planDetails.sections?.slice(0, 4).join(', ') || 'content sections';
        return `Step 2/2: Creating ${sectionsList}${planDetails.sections && planDetails.sections.length > 4 ? ' and more sections' : ''}`;
      case 5:
        return planDetails.palette?.background
          ? `Step 2/2: Designing with ${planDetails.palette.background} background and ${planDetails.palette.text} text for optimal readability`
          : codingMessages[index % codingMessages.length];
      default:
        return codingMessages[index % codingMessages.length];
    }
  };

  const previewRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Restore draft state on mount (and when loading a specific site via URL).
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const siteKey = loadSiteIdFromUrl ? `easyland:draft:v1:site:${loadSiteIdFromUrl}` : null;
    const normalizedLastKey = 'easyland:draft:v1:last';

    const applySnapshot = (snapshot: DraftSnapshot) => {
      setDescription(snapshot.description ?? '');
      setWebsiteStyle(snapshot.websiteStyle ?? 'Professional');
      // Never resume mid-loading on refresh.
      setLoading('idle');
      setPlan(snapshot.plan ?? null);
      setPlanDetails(snapshot.planDetails ?? null);
      setHtml(snapshot.html ?? '');
      // Cap history to avoid huge localStorage writes and memory usage.
      const cappedHistory = Array.isArray(snapshot.history) ? snapshot.history.slice(-20) : [];
      setHistory(cappedHistory);
      const cappedRedoStack = Array.isArray(snapshot.redoStack) ? snapshot.redoStack.slice(-20) : [];
      setRedoStack(cappedRedoStack);
      setPublishedUrl(snapshot.publishedUrl ?? '');
      setSavedSiteId(snapshot.savedSiteId ?? '');
      setView(snapshot.view ?? 'input');
      setEditMode(!!snapshot.editMode);
      setEditingUrl(!!snapshot.editingUrl);
      setCustomUrlSlug(snapshot.customUrlSlug ?? '');
    };

    // Helper function to get the best available draft
    const getBestDraft = () => {
      // If we have a specific site key from URL, try that first
      if (siteKey) {
        const siteDraft = readDraft(siteKey);
        if (siteDraft?.snapshot) {
          return { draft: siteDraft, shouldConfirm: true };
        }
      }

      // Try the last draft
      const lastDraft = readDraft(normalizedLastKey);
      if (lastDraft?.snapshot) {
        // If the last draft has a savedSiteId, also check the site-specific draft
        if (lastDraft.snapshot.savedSiteId) {
          const siteSpecificKey = `easyland:draft:v1:site:${lastDraft.snapshot.savedSiteId}`;
          const siteSpecificDraft = readDraft(siteSpecificKey);

          // Use the more recent draft
          if (siteSpecificDraft?.snapshot &&
              siteSpecificDraft.updatedAt > lastDraft.updatedAt) {
            return { draft: siteSpecificDraft, shouldConfirm: false };
          }
        }

        return { draft: lastDraft, shouldConfirm: false };
      }

      return null;
    };

    const bestDraft = getBestDraft();

    if (bestDraft) {
      // Always auto-restore drafts without prompting - simpler UX
      applySnapshot(bestDraft.draft.snapshot);
      if (bestDraft.shouldConfirm) {
        // Clear the URL param since we're auto-restoring
        clearSearchParam('loadSite');
      }
    }

    setDraftHydrated(true);
  }, [loadSiteIdFromUrl]);

  // Autosave draft state (debounced) so refresh/navigation doesn't lose work.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!draftHydrated) return;

    const snapshot: DraftSnapshot = {
      description,
      websiteStyle,
      loading,
      plan,
      planDetails,
      html,
      history: history.slice(-20),
      redoStack: redoStack.slice(-20),
      publishedUrl,
      savedSiteId,
      view,
      editMode,
      editingUrl,
      customUrlSlug,
    };

    const payload: DraftPayloadV1 = {
      version: 1,
      updatedAt: Date.now(),
      snapshot,
    };

    setAutoSaveStatus('saving');
    const timer = window.setTimeout(() => {
      safeWriteDraft(activeDraftKey, payload);
      safeWriteDraft('easyland:draft:v1:last', payload);
      setAutoSaveStatus('saved');
      
      // Reset to idle after showing saved status
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    activeDraftKey,
    draftHydrated,
    description,
    websiteStyle,
    loading,
    plan,
    planDetails,
    html,
    history,
    redoStack,
    publishedUrl,
    savedSiteId,
    view,
    editMode,
    editingUrl,
    customUrlSlug,
  ]);

  useEffect(() => {
    selectedElRef.current = selectedEl;
  }, [selectedEl]);

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    // Always render the generated page inside an iframe so its CSS never affects the editor UI.
    // (Direct HTML injection can leak <style> into the parent document.)
    container.innerHTML = '';
    previewIframeRef.current = null;

    if (!html) return;

    const iframe = document.createElement('iframe');
    previewIframeRef.current = iframe;

    // Position absolutely to fill the container completely
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.title = 'Landing Page Preview';
    // Disable scripts for safety; keep same-origin so we can support edit-mode interactions.
    iframe.setAttribute('sandbox', 'allow-same-origin allow-forms');

    // Ensure we always have a complete HTML document
    let fullHtml = html;
    if (!html.trim().startsWith('<!doctype') && !html.trim().startsWith('<!DOCTYPE') && !html.trim().startsWith('<html')) {
      fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview</title></head><body>${html}</body></html>`;
    }

    iframe.srcdoc = fullHtml;

    container.appendChild(iframe);

    return () => {
      if (previewIframeRef.current === iframe) previewIframeRef.current = null;
    };
  }, [html]);

  function getPreviewHtml(): string | null {
    const iframe = previewIframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return null;
    // Return full HTML document including head and styles to prevent CSS loss
    return doc.documentElement.outerHTML;
  }

  function commitPreviewToState() {
    const updated = getPreviewHtml();
    if (typeof updated !== 'string') return;
    setHtml(updated);
  }

  function clearSelectionInPreview(el?: HTMLElement | null) {
    const node = el ?? selectedElRef.current;
    if (!node) return;
    node.classList.remove('edit-mode-selected');
    const badge = node.querySelector('.edit-mode-badge');
    if (badge) badge.remove();
    const replaceBtn = node.querySelector('.edit-mode-replace-btn');
    if (replaceBtn) replaceBtn.remove();
    node.contentEditable = 'false';
  }

  function clearEditArtifactsInPreview() {
    const iframe = previewIframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;

    // Remove edit-mode CSS
    const editModeStyle = doc.getElementById('edit-mode-styles');
    if (editModeStyle) editModeStyle.remove();

    // Remove any lingering edit-mode artifacts
    const editableEls = doc.querySelectorAll<HTMLElement>('[contenteditable]');
    editableEls.forEach((el) => el.removeAttribute('contenteditable'));

    // Remove selection classes and badges
    const selectedEls = doc.querySelectorAll('.edit-mode-selected');
    selectedEls.forEach((el) => el.classList.remove('edit-mode-selected'));
    
    const badges = doc.querySelectorAll('.edit-mode-badge');
    badges.forEach((badge) => badge.remove());
    
    const replaceBtns = doc.querySelectorAll('.edit-mode-replace-btn');
    replaceBtns.forEach((btn) => btn.remove());

    // Re-enable any form controls that were disabled by edit mode
    const disabledByEditMode = doc.querySelectorAll<HTMLElement>('[data-easyland-edit-disabled="1"]');
    disabledByEditMode.forEach((el) => {
      el.removeAttribute('data-easyland-edit-disabled');
      // Only remove disabled if we added it
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLButtonElement
      ) {
        el.disabled = false;
      }
    });

    const allEls = doc.querySelectorAll<HTMLElement>('*');
    allEls.forEach((el) => {
      const outline = el.style.outline || '';
      // Only remove inline outlines that look like our selection outline.
      if (
        outline.includes('dashed') &&
        (outline.includes('#7c3aed') || outline.includes('rgb(124, 58, 237)'))
      ) {
        el.style.outline = '';
      }
    });
  }

  // Cycle through detailed status messages during loading phases
  useEffect(() => {
    if (loading === 'idle') {
      setMessageIndex(0);
      return;
    }

    const messages = loading === 'planning' ? planningMessages : loading === 'coding' ? codingMessages : [];
    if (messages.length === 0) return;

    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 6000); // Change message every 6 seconds

    return () => clearInterval(interval);
  }, [loading]);

  // Load site from URL parameter on mount (for "Load in Editor" functionality)
  useEffect(() => {
    if (!draftHydrated) return;
    // If the user chose to restore a local draft, we already cleared `loadSite`.
    const loadSiteId = searchParams.get('loadSite');
    if (loadSiteId) {
      console.log('Loading site from URL parameter:', loadSiteId);
      fetchSiteForEditing(loadSiteId);
    }
  }, [searchParams, draftHydrated]);

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
        setEditMode(true); // Automatically enable edit mode when loading site for editing
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
    if (!editMode) return;
    const iframe = previewIframeRef.current;
    if (!iframe) return;

    const attach = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const docEl = doc.documentElement;
      const bodyEl = doc.body;

      // Inject edit-mode CSS for hover states and selection indicators
      let editModeStyle = doc.getElementById('edit-mode-styles');
      if (!editModeStyle) {
        editModeStyle = doc.createElement('style');
        editModeStyle.id = 'edit-mode-styles';
        editModeStyle.textContent = `
          /* Edit mode hover states */
          body *:not(html):not(body):not(script):not(style):hover {
            outline: 2px solid rgba(59, 130, 246, 0.3) !important;
            cursor: pointer !important;
            background-color: rgba(59, 130, 246, 0.05) !important;
          }

          /* Selected element indicator */
          .edit-mode-selected {
            outline: 3px solid #7c3aed !important;
            box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.2), 0 4px 12px rgba(124, 58, 237, 0.3) !important;
            position: relative !important;
          }

          /* Element type badge */
          .edit-mode-badge {
            position: absolute !important;
            top: -24px !important;
            left: 0 !important;
            background: #7c3aed !important;
            color: white !important;
            padding: 2px 8px !important;
            border-radius: 4px !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            z-index: 10000 !important;
            pointer-events: none !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
          }
        `;
        doc.head.appendChild(editModeStyle);
      }

      // Prevent form submission in edit mode
      function handleSubmit(e: Event) {
        if (!editMode) return;
        e.preventDefault();
        e.stopPropagation();
      }

      function setFormControlsDisabled(currentDoc: Document, disabled: boolean) {
        const forms = currentDoc.querySelectorAll('form');
        forms.forEach((form) => {
          const controls = form.querySelectorAll<HTMLElement>('input, textarea, select, button');
          controls.forEach((control) => {
            const controlEl = control as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement;
            if (disabled) {
              // Mark so we can restore on exit/cleanup
              if (controlEl.disabled !== true) {
                controlEl.disabled = true;
                control.setAttribute('data-easyland-edit-disabled', '1');
              }
            } else {
              if (control.getAttribute('data-easyland-edit-disabled') === '1') {
                control.removeAttribute('data-easyland-edit-disabled');
                controlEl.disabled = false;
              }
            }
          });
        });
      }

      doc.addEventListener('submit', handleSubmit, true);
      setFormControlsDisabled(doc, true);

      function handleClick(e: MouseEvent) {
        if (!editMode || !doc) return;
        
        const target = e.target as HTMLElement;
        if (!target || target === docEl || target === bodyEl) return;

        const tag = target.tagName.toLowerCase();

        // Prevent default behavior for interactive elements (including nested clicks) to avoid navigation/form submission
        if (target.closest('a, button, input, textarea, select')) {
          e.preventDefault();
          e.stopPropagation();
          // Don't allow selecting interactive controls as editable elements
          return;
        }

        // Don't select edit mode UI elements
        if (target.classList.contains('edit-mode-badge') ||
            target.classList.contains('edit-mode-replace-btn')) {
          return;
        }

        // Remove previous selection styling and badge
        const prevSelected = selectedElRef.current;
        if (prevSelected && prevSelected !== target) {
          clearSelectionInPreview(prevSelected);
        }
        
        selectedElRef.current = target;
        setSelectedEl(target);
        
        // Add selection styling
        target.classList.add('edit-mode-selected');

        // Add element type badge
        const existingBadge = target.querySelector('.edit-mode-badge');
        if (!existingBadge) {
          const badge = doc.createElement('div');
          badge.className = 'edit-mode-badge';
          badge.textContent = getElementTypeName(tag);
          target.style.position = target.style.position || 'relative';
          target.insertBefore(badge, target.firstChild);
        }

        const nonEditableTags = new Set(['img', 'svg', 'a', 'button', 'input', 'form', 'select', 'textarea']);

        // If clicking on a non-editable element that's already selected, deselect it
        if (nonEditableTags.has(tag) && prevSelected === target) {
          clearSelectionInPreview(target);
          selectedElRef.current = null;
          setSelectedEl(null);
          return;
        }
        if (!nonEditableTags.has(tag)) {
          target.contentEditable = 'true';
          target.focus();
        } else if (tag === 'img') {
          // For images, add a replace button
          const existingReplaceBtn = target.querySelector('.edit-mode-replace-btn');
          if (!existingReplaceBtn) {
            const replaceBtn = doc.createElement('button');
            replaceBtn.className = 'edit-mode-replace-btn';
            replaceBtn.textContent = '📷 Replace Image';
            replaceBtn.style.cssText = `
              position: absolute !important;
              top: 50% !important;
              left: 50% !important;
              transform: translate(-50%, -50%) !important;
              background: #7c3aed !important;
              color: white !important;
              border: none !important;
              padding: 8px 16px !important;
              border-radius: 6px !important;
              font-size: 14px !important;
              font-weight: 600 !important;
              cursor: pointer !important;
              z-index: 10001 !important;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            `;
            replaceBtn.onclick = (e) => {
              e.stopPropagation();
              triggerImageUpload();
            };
            target.style.position = 'relative';
            target.appendChild(replaceBtn);
          }
        }
      }
      
      function getElementTypeName(tag: string): string {
        const typeMap: Record<string, string> = {
          h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3',
          h4: 'Heading 4', h5: 'Heading 5', h6: 'Heading 6',
          p: 'Paragraph', span: 'Text', div: 'Container',
          img: 'Image', a: 'Link', button: 'Button',
          ul: 'List', ol: 'List', li: 'List Item',
          section: 'Section', header: 'Header', footer: 'Footer',
          nav: 'Navigation', article: 'Article', aside: 'Sidebar'
        };
        return typeMap[tag] || tag.toUpperCase();
      }

      function handleKeyDown(e: KeyboardEvent) {
        if (!editMode) return;
        const metaOrCtrl = e.metaKey || e.ctrlKey;
        
        // Undo: Ctrl+Z / Cmd+Z
        if (metaOrCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault();
          doUndo();
          return;
        }
        
        // Redo: Ctrl+Y / Cmd+Shift+Z
        if ((metaOrCtrl && e.key.toLowerCase() === 'y') || (metaOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
          e.preventDefault();
          doRedo();
          return;
        }
        
        if (e.key === 'Escape') {
          e.preventDefault();
          // Do not commit HTML to state while editing (would reload iframe).
          pushHistory();
          if (selectedElRef.current) {
            selectedElRef.current.contentEditable = 'false';
          }
          return;
        }
        if (e.key === 'Delete' && selectedElRef.current && bodyEl?.contains(selectedElRef.current)) {
          e.preventDefault();
          pushHistory();
          selectedElRef.current.remove();
          selectedElRef.current = null;
          setSelectedEl(null);
        }
      }

      function handleFocusOut(e: FocusEvent) {
        if (!editMode) return;
        const t = e.target as HTMLElement | null;
        // Only capture edits from actual editable elements; avoid committing HTML while editing (reloads iframe).
        if (t && t.isContentEditable) {
          pushHistory();
        }
      }

      doc.addEventListener('click', handleClick);
      // capture focus changes inside the iframe document
      doc.addEventListener('focusout', handleFocusOut, true);
      window.addEventListener('keydown', handleKeyDown, true);

      return () => {
        doc.removeEventListener('click', handleClick);
        doc.removeEventListener('focusout', handleFocusOut, true);
        window.removeEventListener('keydown', handleKeyDown, true);
        doc.removeEventListener('submit', handleSubmit, true);
        setFormControlsDisabled(doc, false);
      };
    };

    // iframe doc may not be ready immediately after srcdoc update
    let detach: void | (() => void);
    const onLoad = () => {
      detach?.();
      detach = attach();
    };

    iframe.addEventListener('load', onLoad);
    // Try immediately too (covers cases where load already fired)
    detach = attach();

    return () => {
      iframe.removeEventListener('load', onLoad);
      detach?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode]);

  function pushHistory() {
    const current = getPreviewHtml() ?? html;
    if (typeof current !== 'string') return;
    setHistory((h) => [...h, current]);
    // Clear redo stack when new edits are made
    setRedoStack([]);
  }

  function doUndo() {
    if (history.length < 1) return;
    const latest = history[history.length - 1];
    const current = getPreviewHtml() ?? html;
    
    // Push current state to redo stack before undoing
    if (typeof current === 'string') {
      setRedoStack((r) => [...r, current]);
    }
    
    setHistory((h) => h.slice(0, -1));
    setHtml(latest);
    if (selectedEl) {
      clearSelectionInPreview(selectedEl);
      setSelectedEl(null);
      selectedElRef.current = null;
    }
  }

  function doRedo() {
    if (redoStack.length < 1) return;
    const redoState = redoStack[redoStack.length - 1];
    const current = getPreviewHtml() ?? html;
    
    // Push current state to history before redoing
    if (typeof current === 'string') {
      setHistory((h) => [...h, current]);
    }
    
    setRedoStack((r) => r.slice(0, -1));
    setHtml(redoState);
    if (selectedEl) {
      clearSelectionInPreview(selectedEl);
      setSelectedEl(null);
      selectedElRef.current = null;
    }
  }

  // Commit the current iframe HTML back to state.
  // IMPORTANT: this reloads the iframe (because preview is driven by `html`), so do not call this while actively editing.
  function finalizeEdit() {
    commitPreviewToState();
  }

  function handleImageReplacement(file: File) {
    if (!selectedEl || selectedEl.tagName.toLowerCase() !== 'img') return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string' && selectedEl) {
        pushHistory();
        (selectedEl as HTMLImageElement).src = result;
        finalizeEdit();
      }
    };
    reader.readAsDataURL(file);
  }

  function triggerImageUpload() {
    imageInputRef.current?.click();
  }

  function cleanHtmlForPublishing(html: string): string {
    // Create a temporary element to parse and clean the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Remove edit-mode injected artifacts
    const editModeStyle = tempDiv.querySelector('#edit-mode-styles');
    if (editModeStyle) editModeStyle.remove();
    tempDiv.querySelectorAll('.edit-mode-badge, .edit-mode-replace-btn').forEach((el) => el.remove());
    tempDiv.querySelectorAll('.edit-mode-selected').forEach((el) => el.classList.remove('edit-mode-selected'));

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

      // Restore form controls that were disabled only for editing
      if (el.getAttribute('data-easyland-edit-disabled') === '1') {
        el.removeAttribute('data-easyland-edit-disabled');
        if (
          htmlEl instanceof HTMLInputElement ||
          htmlEl instanceof HTMLTextAreaElement ||
          htmlEl instanceof HTMLSelectElement ||
          htmlEl instanceof HTMLButtonElement
        ) {
          htmlEl.disabled = false;
        }
        el.removeAttribute('disabled');
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
      setPlanDetails({ style: websiteStyle });
      setMessageIndex(0);
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

      // Extract useful details from the plan for better loading context
      setPlanDetails({
        title: planOut.title,
        sectionCount: 3, // Always 3 sections: hero, audience, contact
        sections: ['hero', 'audience', 'contact'],
        style: websiteStyle,
        palette: planOut.palette,
        fonts: planOut.fonts,
        imageQueries: planOut.images?.map(img => img.query) || []
      });

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
      setRedoStack([]);
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
      const currentHtml = (editMode ? getPreviewHtml() : null) ?? html;
      const cleanedHtml = cleanHtmlForPublishing(currentHtml);
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: savedSiteId || undefined, // Pass existing ID if updating
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

      // Always save/update before publishing to ensure we have the latest HTML with correct form action
      const currentHtml = (editMode ? getPreviewHtml() : null) ?? html;
      const cleanedHtml = cleanHtmlForPublishing(currentHtml);
      const saveRes = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: savedSiteId || undefined, // Pass existing ID if updating
          title: plan?.title ?? 'Landing',
          description,
          plan,
          html: cleanedHtml,
          vercelUrl: publishedUrl || null,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData?.error || 'Save failed');
      const siteIdToUse = saveData.id;
      setSavedSiteId(siteIdToUse);

      // Fetch the saved HTML from the database (which has the placeholder replaced)
      const siteRes = await fetch(`/api/sites/${siteIdToUse}`);
      if (!siteRes.ok) throw new Error('Failed to fetch saved site data');
      const siteData = await siteRes.json();
      const savedHtml = siteData.site?.html;

      if (!savedHtml) {
        throw new Error('No HTML found in saved site');
      }

      // Publish using the saved HTML (which has the correct form action)
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: savedHtml,
          nameHint: urlSlug || customUrlSlug || plan?.title || 'landing',
          siteId: siteIdToUse,
          exactName: !!urlSlug, // Use exact name when urlSlug is provided (from URL editing)
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

  const getStatusMessage = () => {
    if (loading === 'planning') {
      // If we have plan details, show detailed info; otherwise cycle through planning messages
      if (planDetails?.title) {
        return `Step 1/2: Planning ${planDetails.style?.toLowerCase() || 'professional'} layout, colors, fonts, and content structure...`;
      }
      return planningMessages[messageIndex] || 'Step 1/2: Analyzing your idea and creating a design plan...';
    }

    if (loading === 'coding') {
      // If we have plan details, cycle through detailed aspects; otherwise cycle through coding messages
      if (planDetails?.title) {
        return getDetailedCodingMessage(messageIndex);
      }
      return codingMessages[messageIndex] || 'Step 2/2: Converting design to responsive HTML and CSS...';
    }

    if (loading === 'publishing') return 'Publishing to Vercel...';
    if (loading === 'saving') return 'Saving...';
    return '';
  };

  const status = getStatusMessage();

  return (
    <>
      {/* Hidden file input for image replacement */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleImageReplacement(file);
            e.target.value = ''; // Reset input
          }
        }}
      />
      
      <PurchaseCreditsModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />

      <SignedOut>
        <div className="min-h-screen bg-black">
          {/* Modern Hero Section */}
          <section className="relative py-20 md:py-32 lg:py-40 overflow-hidden">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-purple-600/90 to-indigo-600/90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

            {/* Decorative elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />

            <div className="container relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-8 md:space-y-12">
                {/* Main heading */}
                <div className="space-y-4 md:space-y-6">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight max-w-6xl mx-auto">
                    World's Easiest 
                    <span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent leading-relaxed py-1">
                      Landing Page Generator
                    </span>
                    For Busy Creators.
                  </h1>
                  <p className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                    No coding. No design skills. Just describe your idea and publish a high-converting landing page in no time.
                  </p>
                </div>

                {/* CTA Button */}
                <div className="pt-4">
                  <SignInButton mode="modal">
                    <button className="btn btn-primary text-lg md:text-xl px-8 md:px-12 py-4 md:py-6 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 bg-gradient-to-r from-black to-gray-900 text-white hover:from-gray-900 hover:to-gray-800 font-semibold rounded-2xl">
                      <svg className="w-5 h-5 md:w-6 md:h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Start Creating for Free
                    </button>
                  </SignInButton>
                </div>

                {/* Additional visual elements */}
                <div className="pt-8 md:pt-12">
                  <div className="flex items-center justify-center space-x-8 text-white/70 text-sm md:text-base">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>No credit card required</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Free to start</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Who Is This For Section */}
          <section className="py-20 md:py-32 bg-gradient-to-br from-gray-50 to-white">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 md:mb-20">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  Who Is This For?
                </h2>
                <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  EasyLand is perfect for creators who need a quick landing page that converts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {/* Creators */}
                <div className="group card hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-200">
                      Creators
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Launch your MVP landing page quickly to validate ideas and start collecting leads
                    </p>
                  </div>
                </div>

                {/* Freelancers & Agencies */}
                <div className="group card hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors duration-200">
                      Freelancers & Agencies
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Deliver client landing pages faster and focus on strategy instead of coding
                    </p>
                  </div>
                </div>

                {/* Small Business Owners */}
                <div className="group card hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors duration-200">
                      Small Business Owners
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Get a professional online presence without breaking the bank or hiring developers
                    </p>
                  </div>
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
                      <h1 className="text-lg md:text-xl font-bold text-black truncate">EasyLand</h1>
                      <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Landing Page Generator</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <div className="hidden sm:block flex-shrink-0">
                      <button
                        onClick={() => setShowPurchaseModal(true)}
                        className="btn btn-outline text-xs px-3 py-1"
                      >
                        Add Credits
                      </button>
                    </div>

                    <Link href="/dashboard" className="btn btn-ghost text-gray-700 hover:text-black px-3 md:px-4 py-2 transition-colors duration-200 flex-shrink-0 text-sm md:text-base hidden sm:inline-flex">
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
                {/* Mobile add credits button */}
                <div className="sm:hidden mt-3">
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="btn btn-outline text-xs px-3 py-1 w-full"
                  >
                    Add Credits
                  </button>
                </div>
              </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
              <div className="w-full max-w-2xl flex flex-col gap-6">
                <div className="text-gray-600 text-lg text-center font-bold">
                  What landing page do you want to create?
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
                      <div className="flex items-center gap-2">
                        <CreditDisplay showButton={false} />
                        <button
                          onClick={handleGenerate}
                          disabled={!description || isGenerating}
                          className="btn btn-primary p-2 w-8 h-8 flex items-center justify-center flex-shrink-0"
                          title={isGenerating ? 'Generating...' : 'Generate Landing Page'}
                        >
                          {isGenerating ? (
                            <div className="spinner w-5 h-5" />
                          ) : (
                            <svg 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              style={{ width: '1.75rem', height: '1.75rem', minWidth: '1.75rem', minHeight: '1.75rem' }}
                            >
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clickable Prompt Examples */}
                {loading === 'idle' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setDescription("Maman is a café, bakery, restaurant and event space. Maman's menu highlights childhood favorites from the south of france and north america.")}
                        className="text-left p-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-md transition-colors duration-150"
                      >
                        French café with childhood favorite dishes...
                      </button>

                      <button
                        onClick={() => setDescription("FitZone is a boutique fitness studio offering personalized training sessions and group classes. We help busy professionals get in shape with flexible scheduling and expert coaches.")}
                        className="text-left p-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-md transition-colors duration-150"
                      >
                        Boutique fitness studio for busy professionals...
                      </button>

                      <button
                        onClick={() => setDescription("NatureWell provides natural wellness products including vitamins, supplements, and organic skincare. All products are sourced from trusted suppliers and backed by science.")}
                        className="text-left p-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-md transition-colors duration-150"
                      >
                        Natural wellness products and supplements...
                      </button>

                      <button
                        onClick={() => setDescription("Mindful Therapy offers counseling services for individuals and couples. We specialize in anxiety, depression, and relationship counseling with compassionate care.")}
                        className="text-left p-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-md transition-colors duration-150"
                      >
                        Counseling services for mental wellness...
                      </button>
                    </div>
                  </div>
                )}

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
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10 shadow-sm">
              <div className="container py-4 md:py-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <button
                      onClick={() => {
                        setView('input');
                        if (editMode) {
                          clearEditArtifactsInPreview();
                          commitPreviewToState();
                        }
                        clearSelectionInPreview();
                        setSelectedEl(null);
                        selectedElRef.current = null;
                        setEditMode(false);
                      }}
                      className="btn btn-ghost text-gray-700 hover:text-black px-3 md:px-4 py-2 transition-colors duration-200 flex-shrink-0 text-sm md:text-base"
                    >
                      ← Back
                    </button>
                    <div style={{
                      height: '1rem',
                      width: '1px',
                      backgroundColor: 'var(--color-gray-200)'
                    }} />
                   
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                  <button
                    onClick={() => {
                      setEditMode((v) => {
                        const next = !v;
                        if (!next) {
                          clearSelectionInPreview();
                          setSelectedEl(null);
                          selectedElRef.current = null;
                          clearEditArtifactsInPreview();
                          finalizeEdit();
                        }
                        return next;
                      });
                    }}
                    disabled={!html || isGenerating}
                    className={`btn btn-ghost text-gray-700 hover:text-black px-3 md:px-4 py-2 transition-colors duration-200 flex-shrink-0 text-sm md:text-base ${editMode ? 'text-green-600' : ''}`}
                  >
                    {editMode ? '✓ Edit Mode' : 'Edit Text'}
                  </button>

                  <button
                    onClick={doUndo}
                    disabled={history.length < 1}
                    className="btn btn-ghost text-gray-700 hover:text-black px-3 md:px-4 py-2 transition-colors duration-200 flex-shrink-0 text-sm md:text-base"
                    title="Undo (Cmd/Ctrl+Z)"
                  >
                    ↶
                  </button>

                  <button
                    onClick={doRedo}
                    disabled={redoStack.length < 1}
                    className="btn btn-ghost text-gray-700 hover:text-black px-3 md:px-4 py-2 transition-colors duration-200 flex-shrink-0 text-sm md:text-base"
                    title="Redo (Cmd/Ctrl+Y or Cmd+Shift+Z)"
                  >
                    ↷
                  </button>

                    <div style={{
                      height: '1rem',
                      width: '1px',
                      backgroundColor: 'var(--color-gray-200)'
                    }} />

                  <button
                    onClick={handleSave}
                    disabled={!html || isGenerating}
                    className="btn btn-ghost text-gray-700 hover:text-black px-3 md:px-4 py-2 transition-colors duration-200 flex-shrink-0 text-sm md:text-base"
                  >
                    {loading === 'saving' ? 'Saving...' : savedSiteId ? 'Saved ✓' : 'Save Draft'}
                  </button>

                  {/* Auto-save indicator */}
                  {autoSaveStatus !== 'idle' && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 px-2">
                      {autoSaveStatus === 'saving' && (
                        <>
                          <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
                          <span>Auto-saving...</span>
                        </>
                      )}
                      {autoSaveStatus === 'saved' && (
                        <>
                          <span className="text-green-600">✓</span>
                          <span className="text-green-600">Auto-saved</span>
                        </>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => handlePublish()}
                    disabled={!html || isGenerating}
                    className="btn btn-ghost text-gray-700 hover:text-black px-3 md:px-4 py-2 transition-colors duration-200 flex-shrink-0 text-sm md:text-base"
                  >
                    {loading === 'publishing' ? 'Publishing...' : 'Publish Live'}
                  </button>

                  <div style={{
                    height: '1rem',
                    width: '1px',
                    backgroundColor: 'var(--color-gray-200)'
                  }} />

                    <div className="flex-shrink-0">
                      <UserButton />
                    </div>
                  </div>
                </div>
                {/* Mobile add credits button */}
                <div className="sm:hidden mt-3">
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="btn btn-outline text-xs px-3 py-1 w-full"
                  >
                    Add Credits
                  </button>
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
                            <input
                              type="text"
                              value={publishedUrl || ''}
                              onChange={(e) => setPublishedUrl(e.target.value)}
                              className="input"
                              style={{
                                fontSize: '0.875rem',
                                padding: '0.25rem 0.5rem',
                                width: '200px',
                                height: 'auto'
                              }}
                              placeholder="your-site.vercel.app"
                            />
                            <button
                              onClick={() => {
                                // Extract slug from the full URL input
                                const slug = publishedUrl.trim().split('.')[0];
                                handlePublish(slug);
                              }}
                              disabled={!publishedUrl.trim() || loading === 'publishing'}
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

            <main
              ref={previewRef}
              style={{
                flex: 1,
                // Critical for nested scrolling inside a column flex container
                minHeight: 0,
                position: 'relative',
              }}
            />
            {editMode && (
              <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-xs text-gray-600 text-center">
                    <span className="sm:hidden">Tap text to edit</span>
                    <span className="hidden sm:inline">Click text to edit</span>
                    <span className="ml-2 text-gray-400">• Esc to exit</span>
                  </div>
                </div>
              </div>
            )}
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
