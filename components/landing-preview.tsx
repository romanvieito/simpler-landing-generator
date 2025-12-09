import { GeneratedLanding } from "@/lib/generator";

type LandingPreviewProps = {
  content: GeneratedLanding;
  showHeader?: boolean;
};

const bulletIcons = ["✅", "⚡️", "📱", "🔗"];

export function LandingPreview({ content, showHeader = true }: LandingPreviewProps) {
  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg ring-1 ring-white/10 backdrop-blur">
      {showHeader ? (
        <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-[#9cc2ff]">Preview</p>
            <p className="text-sm text-neutral-300">Generated landing based on your prompt</p>
          </div>
          <span className="rounded-full bg-gradient-to-r from-[#6b5bff] to-[#67d8ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-sm">
            Ready
          </span>
        </div>
      ) : null}
      <div className="relative grid gap-8 px-8 py-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#9cc2ff]">
            {content.audience}
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
            {content.headline}
          </h1>
          <p className="text-lg text-neutral-200">{content.subhead}</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button className="rounded-full bg-gradient-to-r from-[#6b5bff] via-[#7c5bff] to-[#67d8ff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#6b5bff]/20 transition hover:scale-[1.01] active:scale-[0.99]">
              {content.callToAction}
            </button>
            <button className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-white/30">
              Book a quick call
            </button>
          </div>
          <p className="text-sm text-neutral-400">
            You can tweak this copy inline. Keep it short, benefit-led, and focused on a single CTA.
          </p>
        </div>
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm ring-1 ring-white/10 backdrop-blur">
          <p className="text-sm font-semibold text-white">What ships in your landing</p>
          <ul className="space-y-3 text-sm text-neutral-200">
            {content.features.map((feature, index) => (
              <li className="flex gap-3" key={feature}>
                <span className="text-lg" aria-hidden>
                  {bulletIcons[index % bulletIcons.length]}
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-white/5 px-4 py-3 shadow-sm ring-1 ring-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">Prompt</p>
            <p className="text-sm font-medium text-white">“{content.prompt}”</p>
          </div>
        </div>
      </div>
    </section>
  );
}

