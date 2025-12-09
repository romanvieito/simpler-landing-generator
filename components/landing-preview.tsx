import { GeneratedLanding } from "@/lib/generator";

type LandingPreviewProps = {
  content: GeneratedLanding;
  showHeader?: boolean;
};

const bulletIcons = ["✅", "⚡️", "📱", "🔗"];

export function LandingPreview({ content, showHeader = true }: LandingPreviewProps) {
  return (
    <section className="w-full rounded-3xl border border-neutral-200 bg-white/70 shadow-sm ring-1 ring-black/[0.02] backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      {showHeader ? (
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-white/10">
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-300">
              Preview
            </p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              Generated landing based on your prompt
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
            Ready
          </span>
        </div>
      ) : null}
      <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-200">
            {content.audience}
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-neutral-950 dark:text-white sm:text-4xl">
            {content.headline}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-200">
            {content.subhead}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
              {content.callToAction}
            </button>
            <button className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:border-neutral-400 dark:border-white/30 dark:text-white dark:hover:border-white/50">
              Book a quick call
            </button>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-300">
            You can tweak this copy inline. Keep it short, benefit-led, and focused on a single CTA.
          </p>
        </div>
        <div className="space-y-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 p-6 dark:border-white/15 dark:bg-white/5">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            What ships in your landing
          </p>
          <ul className="space-y-3 text-sm text-neutral-700 dark:text-neutral-200">
            {content.features.map((feature, index) => (
              <li className="flex gap-3" key={feature}>
                <span className="text-lg" aria-hidden>
                  {bulletIcons[index % bulletIcons.length]}
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-300">
              Prompt
            </p>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">
              “{content.prompt}”
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

