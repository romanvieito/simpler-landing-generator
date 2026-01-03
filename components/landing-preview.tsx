import { GeneratedLanding } from "@/lib/generator";

type LandingPreviewProps = {
  content: GeneratedLanding;
  showHeader?: boolean;
};

const bulletIcons = ["✅", "⚡️", "📱", "🔗"];

export function LandingPreview({ content, showHeader = true }: LandingPreviewProps) {
  const sections = content.sectionsContent;

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
            {sections.audience.title}
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-[var(--text-strong)] sm:text-4xl">
            {sections.hero.headline || content.headline}
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            {sections.hero.subhead || content.subhead}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_40px_-20px_rgba(37,99,235,0.8)] transition hover:bg-[var(--accent-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:scale-[0.99]">
              {sections.hero.primaryCta || content.callToAction}
            </button>
            {sections.hero.secondaryCta ? (
              <button className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--text-strong)] transition hover:border-[var(--border-strong)] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
                {sections.hero.secondaryCta}
              </button>
            ) : null}
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Simple, single-page site generated from your prompt.
          </p>
        </div>
        <div className="space-y-5 rounded-[var(--radius-lg)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--text-strong)]">{sections.audience.title}</p>
            <p className="text-sm text-[var(--text-secondary)]">{sections.audience.description}</p>
          </div>
          {(content.imagePrompt || content.imageAlt) && (
            <div className="rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-white px-4 py-3" style={{ boxShadow: "var(--shadow-subtle)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Hero image guidance
              </p>
              <p className="text-sm font-semibold text-[var(--text-strong)]">
                {content.imagePrompt || "Bright, welcoming hero photo with the primary offer in focus."}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Alt text: {content.imageAlt || "Hero image for the landing page"}
              </p>
            </div>
          )}
          <div className="rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-white px-4 py-3" style={{ boxShadow: "var(--shadow-subtle)" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Prompt</p>
            <p className="text-sm font-semibold text-[var(--text-strong)]">“{content.prompt}”</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t border-[var(--border-soft)] bg-white px-8 py-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Contact</p>
          <h3 className="text-xl font-semibold text-[var(--text-strong)]">{sections.contact.title}</h3>
        </div>
        <form className="w-full max-w-md space-y-3 rounded-[var(--radius-lg)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5 shadow-[var(--shadow-subtle)]">
          <label className="block space-y-1 text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-strong)]">{sections.contact.nameLabel}</span>
            <input
              type="text"
              className="w-full rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 text-[var(--text-strong)] shadow-inner outline-none focus:border-[var(--accent)]"
              placeholder="Jane Doe"
              aria-label={sections.contact.nameLabel}
            />
          </label>
          <label className="block space-y-1 text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-strong)]">{sections.contact.emailLabel}</span>
            <input
              type="email"
              className="w-full rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 text-[var(--text-strong)] shadow-inner outline-none focus:border-[var(--accent)]"
              placeholder="you@example.com"
              aria-label={sections.contact.emailLabel}
            />
          </label>
          <label className="block space-y-1 text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-strong)]">{sections.contact.messageLabel}</span>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-[var(--border-soft)] bg-white px-3 py-2 text-[var(--text-strong)] shadow-inner outline-none focus:border-[var(--accent)]"
              placeholder="How can we help?"
              aria-label={sections.contact.messageLabel}
            />
          </label>
          <button
            type="button"
            className="w-full rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_40px_-20px_rgba(37,99,235,0.8)] transition hover:bg-[var(--accent-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:scale-[0.99]"
          >
            {sections.contact.submitLabel}
          </button>
        </form>
      </div>
    </section>
  );
}

