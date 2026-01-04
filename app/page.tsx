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
  const [planDetails, setPlanDetails] = useState<{ title?: string; sectionCount?: number; sections?: string[]; style?: string; palette?: any; fonts?: any; imageQueries?: string[] } | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
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
    'Step 2/2: Completing landing page generation...'
  ];

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewRef.current && html) {
      previewRef.current.innerHTML = html;
    }
  }, [html]);

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
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, [loading]);

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
        sectionCount: planOut.sections?.length || 0,
        sections: planOut.sections?.map(s => s.type) || [],
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
      const cleanedHtml = cleanHtmlForPublishing(html);
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
      // If we have plan details, show the detailed building message; otherwise cycle through coding messages
      if (planDetails?.title) {
        return `Step 2/2: Building "${planDetails.title}" with ${planDetails.sectionCount || 0} sections (${planDetails.sections?.slice(0, 3).join(', ')}${planDetails.sections && planDetails.sections.length > 3 ? '...' : ''})${planDetails.palette?.primary ? ` • ${planDetails.palette.primary} theme` : ''}${planDetails.imageQueries?.length ? ` • Finding ${planDetails.imageQueries.length} images` : ''}`;
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
                      Landing Page Builder
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

                {/* Marketing Teams */}
                <div className="group card hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-200">
                      Marketing Teams
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Create campaign-specific landing pages without waiting for developers
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
                      <CreditDisplay onPurchaseClick={() => setShowPurchaseModal(true)} />
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
                {/* Mobile credit display */}
                <div className="sm:hidden mt-3">
                  <CreditDisplay onPurchaseClick={() => setShowPurchaseModal(true)} />
                </div>
              </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
              <div className="w-full max-w-2xl flex flex-col gap-6">
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
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10 shadow-sm">
              <div className="container py-4 md:py-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
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
                    onClick={() => setEditMode((v) => !v)}
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
                {/* Mobile credit display */}
                <div className="sm:hidden mt-3">
                  <CreditDisplay onPurchaseClick={() => setShowPurchaseModal(true)} />
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
                              onClick={() => handlePublish(publishedUrl.split('.')[0])}
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
