"use client";

import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { LandingPreview } from "@/components/landing-preview";
import { generateLandingContent, type GeneratedLanding } from "@/lib/generator";

type HistoryEntry = {
  id: string;
  prompt: string;
  createdAt: number;
  content: GeneratedLanding;
};

const HISTORY_KEY = "workspaceHistory:v1";
const starterPrompt = "Boutique fitness studio with intro class passes";
const suggestionPrompts = [
  "Mobile pet groomer for busy urban pet owners",
  "Bookkeeping service specializing in food trucks",
  "Home cleaning business offering recurring bundles",
  "Landscaping crew focused on seasonal yard refresh packages",
  "On-site phone/tablet repair for small retailers",
  "Catering service tailored to startup office lunches",
  "Photography mini-sessions for real estate agents",
  "Childcare co-op with flexible weekend care slots",
  "Pool maintenance plans for short-term rentals",
  "Lawn care subscription with seasonal add-ons",
  "Mobile car detailing for apartment dwellers",
  "Tutoring service for middle-school math and science",
  "Handyman specializing in condo punch lists",
  "Window washing bundles for small storefronts",
  "Chimney sweeping and annual fireplace inspections",
  "Personal chef meal prep for new parents",
  "E-bike repair and tune-ups for commuters",
  "Dog walking and drop-in visits for hybrid workers",
  "Interior painting crew with weekend availability",
];

const formatOptions = ["Professional", "Personal", "Business", "Friendly", "Creative"];

const createId = () => (crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`);
const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ")
    .trim();
const buildStarterContent = (rawPrompt: string): GeneratedLanding => {
  const prompt = rawPrompt?.trim() || "local service business";
  const focus = toTitleCase(prompt.length > 80 ? `${prompt.slice(0, 77)}...` : prompt);
  const headline =
    focus.length > 0 ? `${focus} landing in minutes` : "Launch a simple landing in minutes";
  const subhead =
    prompt.length > 0
      ? `Paste your focus (${prompt}) and ship a clean, credible landing without an agency or endless revisions.`
      : "Drop a short prompt and get a ready-to-share landing page that keeps the main thing the main thing.";

  return {
    headline,
    subhead,
    audience: prompt ? `Built for ${prompt.toLowerCase()} owners` : "Built for busy small business owners",
    features: [
      `Clear story: what you do for ${prompt || "customers"} in one scroll.`,
      "Mobile-ready hero with CTA that drives calls or bookings.",
      "Trust signals and benefits copy you can tweak in-line.",
      "Shareable preview link to get sign-off fast.",
    ],
    callToAction: prompt ? "Generate my landing" : "Start with a 30-second prompt",
    prompt: prompt || "busy small business owners",
    style: "Modern",
    sections: ["Hero", "Features", "CTA"],
  };
};

export default function AppWorkspace() {
  const starterContent = useMemo(() => buildStarterContent(starterPrompt), []);
  const { user } = useUser();
  const pathname = usePathname();

  const [prompt, setPrompt] = useState(starterPrompt);
  const [landing, setLanding] = useState<GeneratedLanding | null>(starterContent);
  const [draft, setDraft] = useState<GeneratedLanding | null>(starterContent);
  const [featuresText, setFeaturesText] = useState(starterContent.features.join("\n"));
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored) as HistoryEntry[];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(45); // percent for right column on desktop
  const [dragging, setDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [format, setFormat] = useState(formatOptions[0]);
  const [showFormats, setShowFormats] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [suggestionOffset, setSuggestionOffset] = useState(0);

  const visibleSuggestions = useMemo(() => {
    const take = 4;
    if (suggestionPrompts.length <= take) return suggestionPrompts;
    return Array.from({ length: take }, (_, index) => suggestionPrompts[(suggestionOffset + index) % suggestionPrompts.length]);
  }, [suggestionOffset]);

  const shareUrl = useMemo(() => {
    if (!draft) return "";
    const base = typeof window === "undefined" ? "" : window.location.origin;
    if (!base) return "";
    return `${base}/preview?prompt=${encodeURIComponent(draft.prompt)}`;
  }, [draft]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (event: MouseEvent) => {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      const rightPct = Math.min(70, Math.max(30, 100 - pct));
      setPreviewWidth(rightPct);
    };
    const stop = () => setDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stop);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stop);
    };
  }, [dragging]);

  const saveHistory = (items: HistoryEntry[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
  };

  const handleGenerate = async () => {
    setError("");
    setCopied(false);
    setShowFormats(false);
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please sign in to generate a landing page.");
        }
        throw new Error("Could not generate landing content. Try again.");
      }

      const data = (await response.json()) as GeneratedLanding;
      setLanding(data);
      setDraft(data);
      setFeaturesText(data.features.join("\n"));
      setPreviewVisible(true);

      setHistory((previous) => {
        const next: HistoryEntry[] = [
          {
            id: createId(),
            prompt,
            createdAt: Date.now(),
            content: data,
          },
          ...previous,
        ].slice(0, 20);
        saveHistory(next);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const applyHistory = (entry: HistoryEntry) => {
    setPrompt(entry.prompt);
    setLanding(entry.content);
    setDraft(entry.content);
    setFeaturesText(entry.content.features.join("\n"));
    setPreviewVisible(true);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <main className="flex min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <aside className="flex w-20 flex-col items-center justify-between border-r border-[var(--border-soft)] bg-[var(--surface)]/90 px-4 py-6 backdrop-blur">
        <div className="flex flex-col items-center gap-6">
          <div className="group relative">
            <Link
              href="/app"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-lg font-bold text-white shadow-[0_10px_30px_-18px_rgba(37,99,235,0.8)]"
              aria-label="Workspace home"
            >
              w
            </Link>
            <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-[var(--text-strong)] px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
              Workspace
            </span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="group relative">
              <button
                type="button"
                onClick={() => setPrompt(starterPrompt)}
                className="flex h-12 w-12 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]"
                aria-label="New idea"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                  <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-[var(--text-strong)] px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                New idea
              </span>
            </div>

            <div className="group relative">
              <Link
                href="/app/history"
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
                  pathname === "/app/history"
                    ? "bg-[var(--surface-muted)] text-[var(--text-strong)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]"
                }`}
                aria-label="History"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                  <path
                    d="M12 8v4l2.5 1.5M5.5 11a6.5 6.5 0 111.9 4.6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M5 5v4h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-neutral-900 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                History
              </span>
            </div>

            <div className="group relative">
              <Link
                href="/app/analytics"
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
                  pathname === "/app/analytics"
                    ? "bg-[var(--surface-muted)] text-[var(--text-strong)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]"
                }`}
                aria-label="Analytics"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                  <rect x="5" y="11" width="3" height="7" rx="1" strokeWidth="2" />
                  <rect x="10.5" y="8" width="3" height="10" rx="1" strokeWidth="2" />
                  <rect x="16" y="5" width="3" height="13" rx="1" strokeWidth="2" />
                </svg>
              </Link>
              <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-neutral-900 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                Analytics
              </span>
            </div>

            <div className="group relative">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-strong)]"
                aria-label="Downloads"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                  <path d="M12 5v10M7 10l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 19h14" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-[var(--text-strong)] px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                Downloads
              </span>
            </div>
          </div>
        </div>

        <div className="pb-4">
          <SignedIn>
            <div className="group relative">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-12 w-12 rounded-full shadow-sm",
                  },
                }}
              />
              <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-[var(--text-strong)] px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                Account
              </span>
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <div className="group relative">
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-secondary)] shadow-sm transition hover:bg-[var(--surface)]">
                  Sign in
                </button>
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-[var(--text-strong)] px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  Sign in
                </span>
              </div>
            </SignInButton>
          </SignedOut>
        </div>
      </aside>

      <section className="flex-1 px-6 py-10 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-7">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            {!previewVisible ? (
              <h1 className="text-center text-3xl font-semibold text-[var(--text-strong)] sm:text-4xl">
                What do you want to create?
              </h1>
            ) : null}
            <SignedIn>
              {/* <button
                type="button"
                onClick={() => setPreviewVisible((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </svg>
                {previewVisible ? "Hide preview" : "Show preview"}
              </button> */}
            </SignedIn>
          </div>

          <SignedOut>
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border-soft)] bg-[var(--surface)] p-6 shadow-[var(--shadow-subtle)]">
              <p className="text-sm text-[var(--text-secondary)]">
                Sign in to save prompts, generate, and keep your preview history.
              </p>
              <SignInButton>
                <button className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-18px_rgba(37,99,235,0.8)] transition hover:bg-[var(--accent-strong)]">
                  Sign in to continue
                </button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="relative">
              <div
                ref={gridRef}
                className={`grid w-full grid-cols-1 items-start gap-6 ${
                  draft && previewVisible && isDesktop ? "lg:grid-cols-2" : "lg:grid-cols-1"
                }`}
                style={
                  draft && previewVisible && isDesktop
                    ? {
                        gridTemplateColumns: `${Math.max(30, 100 - previewWidth)}% ${previewWidth}%`,
                      }
                    : undefined
                }
              >
                <div className="space-y-4">
                <div className="rounded-[var(--radius-xl)] border border-[var(--border-soft)] bg-[var(--surface)] shadow-[var(--shadow-subtle)]">
                  <div className="p-4">
                    <textarea
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      placeholder="Ask to build..."
                      rows={3}
                      className="w-full resize-none bg-transparent text-base text-[var(--text-strong)] outline-none placeholder:text-[var(--text-muted)]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-soft)] px-4 py-3">
                    <div className="flex items-center gap-2">
                     
                      {/* Format selector */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowFormats((prev) => !prev)}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                          {format}
                          <svg
                            viewBox="0 0 24 24"
                            className={`h-3.5 w-3.5 transition-transform ${showFormats ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M6 9l6 6 6-6" strokeLinecap="round" />
                          </svg>
                        </button>
                        {showFormats ? (
                          <div className="absolute bottom-full left-0 z-10 mb-2 w-40 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-1 shadow-[var(--shadow-soft)]">
                            {formatOptions.map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  setFormat(option);
                                  setShowFormats(false);
                                }}
                                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-[var(--surface-muted)] ${
                                  option === format
                                    ? "bg-[var(--surface-muted)] font-medium text-[var(--text-strong)]"
                                    : "text-[var(--text-secondary)]"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={loading || !prompt.trim()}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-muted)]"
                    >
                      {loading ? (
                        <svg
                          className="h-4 w-4 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error ? <p className="text-center text-sm text-red-500">{error}</p> : null}

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {visibleSuggestions.map((item, index) => (
                    <button
                      key={`${item}-${index}`}
                      type="button"
                      onClick={() => setPrompt(item)}
                      className="flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
                    >
                      {index === 0 && (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {index === 1 && (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                          <path d="M3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
                          <path d="M13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
                          <path d="M13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                      )}
                      {index === 2 && (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {index === 3 && (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                        </svg>
                      )}
                      {item}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSuggestionOffset((prev) => (prev + 4) % suggestionPrompts.length)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface)] text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)]"
                    aria-label="Refresh suggestions"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

                {draft && previewVisible ? (
                  <div className="rounded-[var(--radius-xl)] border border-[var(--border-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow-subtle)] lg:sticky lg:top-8 lg:self-start lg:pl-3">
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2">
                    
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
                      <div className="flex items-center gap-1 rounded-full border border-[var(--border-soft)] bg-white px-2 py-1">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 3v12" strokeLinecap="round" />
                          <path d="M8.25 6.75 12 3l3.75 3.75" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M5.25 14.25h13.5A1.25 1.25 0 0120 15.5v3.25A2.25 2.25 0 0117.75 21H6.25A2.25 2.25 0 014 18.75V15.5a1.25 1.25 0 011.25-1.25Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Publish
                      </div>
                      <div className="flex items-center gap-1 rounded-full border border-[var(--border-soft)] bg-white px-2 py-1">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M13.5 10.5 21 3" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M15.75 3H21v5.25" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M21 9.75V18a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3h8.25" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Open in new tab
                      </div>
                      <div className="flex items-center gap-1 rounded-full border border-[var(--border-soft)] bg-white px-2 py-1">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M9 3H5a2 2 0 00-2 2v4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M15 3h4a2 2 0 012 2v4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M3 15v4a2 2 0 002 2h4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M21 15v4a2 2 0 01-2 2h-4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Fullscreen
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-4">
                    {loading ? (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-[var(--surface)]/85 backdrop-blur-sm">
                        <div className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_-18px_rgba(37,99,235,0.7)]">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" className="opacity-25" />
                            <path d="M4 12a8 8 0 018-8" className="opacity-75" />
                          </svg>
                          Generating...
                        </div>
                      </div>
                    ) : null}
                    <div className="max-h-[80vh] overflow-auto rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3 shadow-inner">
                      <LandingPreview content={draft} showHeader={false} />
                    </div>
                  </div>
                  </div>
                ) : null}
              </div>

              {draft && previewVisible && isDesktop ? (
                <button
                  type="button"
                  aria-label="Resize preview panel"
                  onMouseDown={() => setDragging(true)}
                  className="pointer-events-auto absolute inset-y-0 hidden w-3 cursor-col-resize items-center justify-center lg:flex"
                  style={{ left: `${Math.max(30, 100 - previewWidth)}%`, transform: "translateX(-6px)" }}
                >
                  <span className="block h-20 w-1 rounded-full bg-[var(--border-strong)] shadow-inner" />
                </button>
              ) : null}
            </div>
          </SignedIn>
        </div>
      </section>
    </main>
  );
}


