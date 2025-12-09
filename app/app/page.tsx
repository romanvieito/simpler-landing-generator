"use client";

import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useMemo, useState } from "react";
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
const starterPrompt = "Productized design for SaaS founders needing quick launches";
const suggestionPrompts = [
  "What if AI tools reshape remote team onboarding?",
  "How can creators ship landing pages faster?",
  "What if local services bundled memberships?",
  "Why are founders skeptical of AI landing copy?",
];

const formatOptions = ["Script", "Landing", "Outline"];

const createId = () => (crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`);

export default function AppWorkspace() {
  const starterContent = useMemo(() => generateLandingContent(starterPrompt), []);
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
  const [format, setFormat] = useState(formatOptions[0]);
  const [showFormats, setShowFormats] = useState(false);

  const shareUrl = useMemo(() => {
    if (!draft) return "";
    const base = typeof window === "undefined" ? "" : window.location.origin;
    if (!base) return "";
    return `${base}/preview?prompt=${encodeURIComponent(draft.prompt)}`;
  }, [draft]);

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
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <main className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <aside className="flex w-20 flex-col items-center justify-between border-r border-neutral-200 bg-white/80 px-4 py-6 backdrop-blur">
        <div className="flex flex-col items-center gap-6">
          <div className="group relative">
            <Link
              href="/app"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-lg font-bold text-white shadow-sm"
              aria-label="Workspace home"
            >
              w
            </Link>
            <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-neutral-900 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
              Workspace
            </span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="group relative">
              <button
                type="button"
                onClick={() => setPrompt(starterPrompt)}
                className="flex h-12 w-12 items-center justify-center rounded-xl text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
                aria-label="New idea"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                  <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-neutral-900 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                New idea
              </span>
            </div>

            <div className="group relative">
              <Link
                href="/app/history"
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
                  pathname === "/app/history"
                    ? "bg-neutral-200 text-neutral-900"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
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
                    ? "bg-neutral-200 text-neutral-900"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
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
                className="flex h-12 w-12 items-center justify-center rounded-xl text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
                aria-label="Downloads"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                  <path d="M12 5v10M7 10l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 19h14" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-neutral-900 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
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
              <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-neutral-900 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                Account
              </span>
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <div className="group relative">
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-300">
                  Sign in
                </button>
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-neutral-900 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  Sign in
                </span>
              </div>
            </SignInButton>
          </SignedOut>
        </div>
      </aside>

      <section className="flex-1 px-6 py-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <h1 className="text-center text-3xl font-semibold sm:text-4xl">What&apos;s your landing idea?</h1>

          <SignedOut>
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-neutral-600">
                Sign in to save prompts, generate, and keep your preview history.
              </p>
              <SignInButton>
                <button className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
                  Sign in to continue
                </button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="w-full">
              <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex flex-1 items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-inner">
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-100"
                        aria-label="Prompt options"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                          <path d="M6 9h12M6 15h12" strokeWidth="2" strokeLinecap="round" />
                          <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                          <circle cx="15" cy="15" r="1.5" fill="currentColor" />
                        </svg>
                      </button>
                      <input
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        placeholder="Describe the landing you want to ship..."
                        className="h-12 flex-1 rounded-full bg-transparent px-2 text-base text-neutral-900 outline-none placeholder:text-neutral-400"
                      />
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowFormats((prev) => !prev)}
                          className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-100"
                        >
                          {format}
                          <svg
                            viewBox="0 0 24 24"
                            className={`h-4 w-4 transition ${showFormats ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                          >
                            <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                        {showFormats ? (
                          <div className="absolute right-0 z-10 mt-2 w-32 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg">
                            {formatOptions.map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  setFormat(option);
                                  setShowFormats(false);
                                }}
                                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-neutral-100 ${
                                  option === format ? "text-neutral-900 font-semibold" : "text-neutral-600"
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
                      disabled={loading}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <svg
                          className="h-5 w-5 animate-spin text-white"
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
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                          <path d="M5 12h14M13 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {error ? <p className="text-sm text-red-500">{error}</p> : null}

                  <div className="flex flex-wrap gap-3">
                    {suggestionPrompts.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPrompt(item)}
                        className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SignedIn>
        </div>
      </section>
    </main>
  );
}


