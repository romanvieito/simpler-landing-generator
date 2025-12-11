import { GeneratedLanding } from "@/lib/generator";

type LandingPreviewProps = {
  content: GeneratedLanding;
  showHeader?: boolean;
};

const bulletIcons = ["✅", "⚡️", "📱", "🔗"];

export function LandingPreview({ content, showHeader = true }: LandingPreviewProps) {
  return (
    <section
      className="relative w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-soft)] bg-[var(--surface)]"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {showHeader ? (
        <div className="relative flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--surface-muted)] px-6 py-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Preview
            </p>
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Generated landing based on your prompt
            </p>
          </div>
          <span className="rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-strong)] shadow-[0_10px_30px_-20px_rgba(37,99,235,0.6)]">
            Ready
          </span>
        </div>
      ) : null}
      <div className="relative grid gap-10 px-8 py-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {content.audience}
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-[var(--text-strong)] sm:text-4xl">
            {content.headline}
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">{content.subhead}</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_40px_-20px_rgba(37,99,235,0.8)] transition hover:bg-[var(--accent-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:scale-[0.99]">
              {content.callToAction}
            </button>
            <button className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--text-strong)] transition hover:border-[var(--border-strong)] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
              Book a quick call
            </button>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            You can tweak this copy inline. Keep it short, benefit-led, and focused on a single CTA.
          </p>
        </div>
        <div className="space-y-5 rounded-[var(--radius-lg)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <p className="text-sm font-semibold text-[var(--text-strong)]">What ships in your landing</p>
          <ul className="space-y-3 text-sm text-[var(--text-primary)]">
            {content.features.map((feature, index) => (
              <li className="flex gap-3" key={feature}>
                <span className="text-lg" aria-hidden>
                  {bulletIcons[index % bulletIcons.length]}
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-white px-4 py-3" style={{ boxShadow: "var(--shadow-subtle)" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Prompt</p>
            <p className="text-sm font-semibold text-[var(--text-strong)]">“{content.prompt}”</p>
          </div>
        </div>
      </div>
    </section>
  );
}

