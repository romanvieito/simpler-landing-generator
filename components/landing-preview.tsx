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
      {/* Hero Section */}
      <div className="relative grid gap-10 px-8 py-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Hero Section
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
          </div>
        </div>
        <div className="space-y-5 rounded-[var(--radius-lg)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          {content.designSystem && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Design System</p>
              <div className="rounded-md border border-[var(--border-soft)] bg-white p-3 text-xs">
                <p className="font-semibold text-[var(--text-strong)]">Mood: {content.designSystem.mood}</p>
                <p className="text-[var(--text-secondary)]">Fonts: {content.designSystem.typography.heading} / {content.designSystem.typography.body}</p>
              </div>
            </div>
          )}
          {(content.imagePrompt || content.imageAlt) && (
            <div className="rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-white px-4 py-3" style={{ boxShadow: "var(--shadow-subtle)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Hero image guidance
              </p>
              <p className="text-sm font-semibold text-[var(--text-strong)]">
                {content.imagePrompt || "Bright, welcoming hero photo with the primary offer in focus."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      {sections.features && sections.features.length > 0 && (
        <div className="border-t border-[var(--border-soft)] bg-[var(--surface-muted)] px-8 py-10">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Features Section
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sections.features.map((feature, i) => (
              <div key={i} className="rounded-lg border border-[var(--border-soft)] bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="mb-3 text-3xl">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-[var(--text-strong)]">{feature.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audience Section */}
      <div className="border-t border-[var(--border-soft)] bg-white px-8 py-10">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Audience Section
        </p>
        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-semibold text-[var(--text-strong)]">{sections.audience.title}</h2>
          <p className="text-base text-[var(--text-secondary)]">{sections.audience.description}</p>
        </div>
        {sections.audience.segments && sections.audience.segments.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sections.audience.segments.map((segment, i) => (
              <div key={i} className="rounded-md border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 shadow-sm">
                <p className="mb-1 text-sm font-bold text-[var(--text-strong)]">{segment.title}</p>
                <p className="text-sm text-[var(--text-secondary)]">{segment.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works Section */}
      {sections.howItWorks && sections.howItWorks.length > 0 && (
        <div className="border-t border-[var(--border-soft)] bg-[var(--surface-muted)] px-8 py-10">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            How It Works Section
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {sections.howItWorks.map((step, i) => (
              <div key={i} className="rounded-lg border border-[var(--border-soft)] bg-white p-6 text-center shadow-sm">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-xl font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[var(--text-strong)]">{step.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Contact Section */}
      <div className="flex flex-col gap-4 border-t border-[var(--border-soft)] bg-white px-8 py-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Contact Section</p>
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

