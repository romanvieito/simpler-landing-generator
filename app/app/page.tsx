"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useMemo, useState } from "react";

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

const createId = () => (crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`);

export default function AppWorkspace() {
  const starterContent = useMemo(() => generateLandingContent(starterPrompt), []);

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
    <main className="min-h-screen bg-black px-6 pb-20 pt-14 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#9cc2ff] ring-1 ring-white/10">
            Workspace
          </p>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Generate, edit, and share your landing in one place.
            </h1>
            <p className="text-sm text-neutral-300">
              Draft with AI, tweak the copy, keep your prompt history, and open a production-style
              preview without leaving this screen.
            </p>
          </div>
        </header>

        <SignedOut>
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-sm ring-1 ring-white/10 backdrop-blur">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">Sign in to use the workspace</h2>
              <p className="text-sm text-neutral-300">
                Your generations and prompt history stay tied to your account.
              </p>
            </div>
            <SignInButton>
              <button className="rounded-full bg-gradient-to-r from-[#6b5bff] to-[#67d8ff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01] active:scale-[0.99]">
                Sign in to continue
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm ring-1 ring-white/10 backdrop-blur">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9cc2ff]">
                        Prompt
                      </p>
                      <p className="text-sm text-neutral-300">Describe the offer and audience.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const regenerated = generateLandingContent(prompt);
                        setLanding(regenerated);
                        setDraft(regenerated);
                        setFeaturesText(regenerated.features.join("\n"));
                      }}
                      className="text-xs font-semibold text-[#9cc2ff] underline underline-offset-4 transition hover:text-white"
                    >
                      Quick draft
                    </button>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Example: Financial planning for first-time founders with a 30 minute consult"
                    className="min-h-[140px] w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white shadow-sm transition focus:border-[#6b5bff] focus:outline-none focus:ring-2 focus:ring-[#6b5bff]/40"
                  />
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6b5bff] to-[#67d8ff] px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Generating..." : "Generate with AI"}
                  </button>
                  {error ? <p className="text-sm text-red-400">{error}</p> : null}
                  <p className="text-xs text-neutral-400">
                    Keep it short—what you sell, who it is for, one promise, and a single CTA.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm ring-1 ring-white/10 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9cc2ff]">
                      History
                    </p>
                    <p className="text-sm text-neutral-300">Recent prompts in this browser.</p>
                  </div>
                  {history.length ? (
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="text-xs font-semibold text-neutral-400 underline underline-offset-4 transition hover:text-white"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                {history.length === 0 ? (
                  <p className="mt-4 text-sm text-neutral-400">
                    Generate to keep a log of your prompts and drafts.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {history.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-semibold text-white">{entry.prompt}</p>
                            <p className="text-xs text-neutral-400">
                              {new Date(entry.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => applyHistory(entry)}
                            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-white/30"
                          >
                            Load
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm ring-1 ring-white/10 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9cc2ff]">
                      Editor
                    </p>
                    <p className="text-sm text-neutral-300">
                      Adjust copy before sharing the preview link.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!shareUrl}
                      className="rounded-full bg-gradient-to-r from-[#6b5bff] to-[#67d8ff] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {copied ? "Copied" : "Copy preview link"}
                    </button>
                    <a
                      href={shareUrl || "#"}
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:border-white/30"
                    >
                      Open preview
                    </a>
                  </div>
                </div>

                {draft ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm font-semibold text-white">
                      <span className="block text-xs uppercase tracking-[0.14em] text-neutral-400">
                        Audience
                      </span>
                      <input
                        value={draft.audience}
                        onChange={(event) =>
                          setDraft((prev) => (prev ? { ...prev, audience: event.target.value } : prev))
                        }
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white shadow-sm focus:border-[#6b5bff] focus:outline-none focus:ring-2 focus:ring-[#6b5bff]/40"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-semibold text-white">
                      <span className="block text-xs uppercase tracking-[0.14em] text-neutral-400">
                        Call to action
                      </span>
                      <input
                        value={draft.callToAction}
                        onChange={(event) =>
                          setDraft((prev) =>
                            prev ? { ...prev, callToAction: event.target.value } : prev,
                          )
                        }
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white shadow-sm focus:border-[#6b5bff] focus:outline-none focus:ring-2 focus:ring-[#6b5bff]/40"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-semibold text-white md:col-span-2">
                      <span className="block text-xs uppercase tracking-[0.14em] text-neutral-400">
                        Headline
                      </span>
                      <input
                        value={draft.headline}
                        onChange={(event) =>
                          setDraft((prev) => (prev ? { ...prev, headline: event.target.value } : prev))
                        }
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white shadow-sm focus:border-[#6b5bff] focus:outline-none focus:ring-2 focus:ring-[#6b5bff]/40"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-semibold text-white md:col-span-2">
                      <span className="block text-xs uppercase tracking-[0.14em] text-neutral-400">
                        Subhead
                      </span>
                      <textarea
                        value={draft.subhead}
                        onChange={(event) =>
                          setDraft((prev) => (prev ? { ...prev, subhead: event.target.value } : prev))
                        }
                        className="min-h-[96px] w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white shadow-sm focus:border-[#6b5bff] focus:outline-none focus:ring-2 focus:ring-[#6b5bff]/40"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-semibold text-white md:col-span-2">
                      <span className="block text-xs uppercase tracking-[0.14em] text-neutral-400">
                        Features (one per line)
                      </span>
                      <textarea
                        value={featuresText}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFeaturesText(value);
                          setDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  features: value
                                    .split("\n")
                                    .map((line) => line.trim())
                                    .filter(Boolean),
                                }
                              : prev,
                          );
                        }}
                        className="min-h-[120px] w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white shadow-sm focus:border-[#6b5bff] focus:outline-none focus:ring-2 focus:ring-[#6b5bff]/40"
                      />
                    </label>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-neutral-300">
                    Generate first to unlock the editor and preview.
                  </p>
                )}
              </div>

              {draft ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg ring-1 ring-white/10 backdrop-blur">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9cc2ff]">
                        Preview
                      </p>
                      <p className="text-sm text-neutral-300">Live view of your edits</p>
                    </div>
                    {landing && landing.prompt === draft.prompt ? (
                      <span className="text-xs font-semibold text-neutral-400">Last AI draft</span>
                    ) : null}
                  </div>
                  <LandingPreview content={draft} showHeader={false} />
                </div>
              ) : null}
            </div>
          </div>
        </SignedIn>
      </div>
    </main>
  );
}


