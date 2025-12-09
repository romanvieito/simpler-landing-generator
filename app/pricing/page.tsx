import type { Metadata } from "next";
import Link from "next/link";

const checkoutUrl =
  process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || "https://stripe.com/payments/checkout";
const portalUrl =
  process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL || "https://dashboard.stripe.com/login";

const plans = [
  {
    name: "Launch",
    price: "$19",
    cadence: "per month",
    description: "Ship a polished landing page and start collecting leads today.",
    features: [
      "Unlimited landing drafts",
      "Shareable preview links",
      "Copy tuned for CTA-first layouts",
      "Light & dark themes",
      "Email capture block",
    ],
  },
  {
    name: "Grow",
    price: "$39",
    cadence: "per month",
    description: "Add analytics and ready-to-send lead exports for teams shipping weekly.",
    features: [
      "Everything in Launch",
      "Lead exports (CSV + webhook)",
      "Analytics snapshot per page",
      "Priority generation queue",
      "Chat support on launch week",
    ],
    highlight: "Most popular",
  },
];

const faqs = [
  {
    q: "Can I cancel any time?",
    a: "Yes. Billing is handled by Stripe. You can cancel or change plans whenever you like from the Stripe customer portal.",
  },
  {
    q: "Do I need to add a card to try it?",
    a: "You can generate and preview without a card. When you are ready to publish or export leads, start a paid plan through Stripe checkout.",
  },
  {
    q: "Can my team use this?",
    a: "Teams typically share prompts and preview links. The Grow plan also supports exporting leads to your CRM or zap workflow.",
  },
  {
    q: "How do I get a Stripe invoice?",
    a: "Stripe emails invoices automatically after payment and keeps a full history inside the billing portal.",
  },
];

export const metadata: Metadata = {
  title: "Pricing | Simpler Landing Generator",
  description: "Pick a plan and pay through Stripe in under a minute.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white px-6 pb-20 pt-16 text-neutral-900 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950 dark:text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <section className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 ring-1 ring-emerald-100 backdrop-blur dark:bg-white/10 dark:text-emerald-100 dark:ring-emerald-900/60">
              Pricing
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
                Stripe ready
              </span>
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Simple pricing, Stripe checkout ready in one click.
            </h1>
            <p className="text-lg text-neutral-700 dark:text-neutral-200">
              Start with Launch to publish a CTA-first page, or upgrade to Grow for analytics,
              exports, and priority support. Billing and security are handled by Stripe.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Checkout with Stripe
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition hover:border-neutral-300 dark:border-white/15 dark:bg-white/10 dark:text-white"
              >
                Keep generating first
              </Link>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-300">
              Secure checkout via Stripe. No contracts. Cancel anytime.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white/80 p-6 shadow-sm ring-1 ring-emerald-50 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-100">
                $
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  What you pay for
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Every plan is focused on shipping pages that convert.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                "Shareable previews to validate messaging fast.",
                "CTA-first layouts tuned for small business offers.",
                "Secure payments, invoices, and billing via Stripe.",
                "Support during your launch week.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-xl bg-white/80 p-3 text-sm text-neutral-800 ring-1 ring-emerald-100 dark:bg-white/5 dark:text-white dark:ring-white/10"
                >
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                    ✓
                  </span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative flex h-full flex-col gap-4 rounded-2xl border border-neutral-200 bg-white/90 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:-translate-y-[1px] hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:ring-white/10"
            >
              {plan.highlight ? (
                <span className="absolute right-4 top-4 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-100">
                  {plan.highlight}
                </span>
              ) : null}
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-200">
                  {plan.name}
                </p>
                <p className="text-3xl font-semibold text-neutral-900 dark:text-white">
                  {plan.price}
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-300">
                    {" "}
                    {plan.cadence}
                  </span>
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">{plan.description}</p>
              </div>
              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-200">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100">
                      ✓
                    </span>
                    <p>{feature}</p>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-2">
                <Link
                  href={checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-[1px] hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Start with Stripe
                </Link>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 rounded-2xl border border-neutral-200 bg-white/90 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:ring-white/10 md:grid-cols-[1.2fr,0.8fr] md:items-center">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-200">
              Powered by Stripe
            </p>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Billing you do not have to think about.</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Stripe handles PCI compliance, invoices, and receipts. Your payment method is never
              stored on our servers. Want to change or cancel? Head to the Stripe portal any time.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={portalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:border-neutral-300 dark:border-white/15 dark:bg-white/10 dark:text-white"
              >
                Open Stripe billing
              </Link>
              <span className="text-xs text-neutral-500 dark:text-neutral-300">
                Verified checkout powered by Stripe.
              </span>
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm ring-1 ring-emerald-50 dark:border-white/10 dark:from-emerald-950/50 dark:via-neutral-900 dark:to-neutral-900 dark:ring-white/10">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              Launch timeline
            </p>
            <ol className="space-y-3 text-sm text-neutral-700 dark:text-neutral-200">
              <li className="flex gap-2">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-100">
                  1
                </span>
                Generate your first landing copy with a one-line prompt.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-100">
                  2
                </span>
                Checkout securely with Stripe and unlock exports + analytics.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-100">
                  3
                </span>
                Publish the CTA-first page or push leads to your CRM.
              </li>
            </ol>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[0.95fr,1.05fr] md:items-start">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-200">
              FAQs
            </p>
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">A few quick answers.</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Need something else? Reply to your receipt email and we will help within one business
              day.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-neutral-200 bg-white/90 p-4 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-white/5 dark:ring-white/10"
              >
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{item.q}</p>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

