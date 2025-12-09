"use client";

import { useEffect, useMemo, useState } from "react";

import { LandingPreview } from "@/components/landing-preview";
import type { GeneratedLanding } from "@/lib/generator";

const starterPrompt =
  "Bookkeeping and payroll for local contractors with same-day replies";

export default function Home() {
  const [prompt, setPrompt] = useState(starterPrompt);
  const [result, setResult] = useState<GeneratedLanding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const shareUrl = useMemo(() => {
    if (!result || !origin) return "";
    return `${origin}/preview?prompt=${encodeURIComponent(result.prompt)}`;
  }, [origin, result]);

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
        throw new Error("Could not generate landing content. Try again.");
      }

      const data = (await response.json()) as GeneratedLanding;
      setResult(data);
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white px-6 pb-20 pt-16 text-neutral-900 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950 dark:text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <header className="flex flex-col gap-4">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-800 ring-1 ring-emerald-100 backdrop-blur dark:bg-white/10 dark:text-emerald-100 dark:ring-emerald-900/60">
            Simpler Landing Generator of the World
          </p>
          <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Generate a clean website from one prompt.
              </h1>
              <p className="text-lg text-neutral-700 dark:text-neutral-200">
                Built for busy creators. Paste your focus, get a
                link you can share, and test your idea in
                minutes.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-sm ring-1 ring-emerald-50 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-100">
                  What do you sell? Who do you serve?
                </label>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: Weekend lawn care plans for busy homeowners that includes seasonal refreshes"
                  className="min-h-[120px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-white/15 dark:bg-neutral-900 dark:text-white dark:focus:border-emerald-300 dark:focus:ring-emerald-900/60"
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {loading ? "Generating..." : "Generate"}
                </button>
                {error ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                ) : null}
                <p className="text-xs text-neutral-500 dark:text-neutral-300">
                  Tip: keep it short—what you do, who it is for, one promise, one call
                  to action.
                </p>
              </div>
            </div>
          </div>
        </header>

        {result ? (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                  Preview ready
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Share this link or tweak copy before you ship to production.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={shareUrl || "#"}
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:border-neutral-300 dark:border-white/15 dark:bg-white/10 dark:text-white"
                >
                  Open preview
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!shareUrl}
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {copied ? "Copied" : "Copy share link"}
                </button>
              </div>
            </div>
            <LandingPreview content={result} />
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-emerald-200 bg-white/70 px-8 py-10 text-neutral-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-neutral-200">
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">
              You’ll see a full preview here after you generate.
            </p>
            <p className="text-sm">
              Paste your focus, click generate, and we’ll draft the hero, benefits, and CTA.
            </p>
          </section>
        )}

        <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:ring-white/10 sm:grid-cols-3">
          {[
            {
              title: "Built for speed",
              body: "30-second prompts create a shareable link so you can get sign-off without back-and-forth.",
            },
            {
              title: "Business ready",
              body: "Track leads with built-in analytics, zero config.",
            },
            {
              title: "CTA-first layouts",
              body: "Every page ships with a primary CTA, contact form, and benefits-led copy that reads clean.",
            },
          ].map((item) => (
            <div className="space-y-2" key={item.title}>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {item.title}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{item.body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
