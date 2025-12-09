"use client";

import { SignedIn, SignedOut, SignInButton, useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const pendingGenerationRef = useRef(false);
  const { openSignIn } = useClerk();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || pendingGenerationRef.current) return;
    const stored = localStorage.getItem("pendingPrompt");
    if (stored) {
      setPrompt(stored);
      pendingGenerationRef.current = true;
      void handleGenerate(stored);
      localStorage.removeItem("pendingPrompt");
    }
  }, [isLoaded, isSignedIn]);

  const shareUrl = useMemo(() => {
    if (!result || !origin) return "";
    return `${origin}/preview?prompt=${encodeURIComponent(result.prompt)}`;
  }, [origin, result]);

  const handleGenerate = async (promptOverride?: string) => {
    const input = promptOverride ?? prompt;
    setError("");
    setCopied(false);
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please sign in to generate a landing page.");
        }
        throw new Error("Could not generate landing content. Try again.");
      }

      const data = (await response.json()) as GeneratedLanding;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      pendingGenerationRef.current = false;
    }
  };

  const handleGenerateSignedOut = () => {
    localStorage.setItem("pendingPrompt", prompt);
    openSignIn();
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
    <main className="min-h-screen bg-black px-6 pb-20 pt-16 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <header className="flex flex-col gap-4">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#9cc2ff] ring-1 ring-white/10">
            Simpler Landing Generator of the World
          </p>
          <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Generate a clean website from one prompt.
              </h1>
              <p className="text-lg text-neutral-200">
                Built for busy creators. Paste your focus, get a link you can share, and test your
                idea in minutes.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm ring-1 ring-white/10 backdrop-blur">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white">What do you sell? Who do you serve?</label>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: Weekend lawn care plans for busy homeowners that includes seasonal refreshes"
                  className="min-h-[120px] w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white shadow-sm transition focus:border-[#6b5bff] focus:outline-none focus:ring-2 focus:ring-[#6b5bff]/40"
                />
                <SignedIn>
                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6b5bff] to-[#67d8ff] px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Generating..." : "Generate"}
                  </button>
                </SignedIn>
                <SignedOut>
                  <button
                    type="button"
                    onClick={handleGenerateSignedOut}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6b5bff] to-[#67d8ff] px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Generate
                  </button>
                  <p className="text-xs text-neutral-400">
                    We’ll ask you to sign in, remember your prompt, and generate right after.
                  </p>
                </SignedOut>
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm ring-1 ring-white/10 backdrop-blur sm:grid-cols-3">
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
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-neutral-300">{item.body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
