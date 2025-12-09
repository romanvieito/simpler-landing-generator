export type GeneratedLanding = {
  headline: string;
  subhead: string;
  audience: string;
  features: string[];
  callToAction: string;
  prompt: string;
};

const defaultFeatures = [
  "Clear offer with one above-the-fold CTA",
  "Benefits-led copy in plain language",
  "Social proof or quick win to build trust",
  "Low-friction way to contact or book",
];

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ")
    .trim();

export const generateLandingContent = (rawPrompt: string): GeneratedLanding => {
  const prompt = rawPrompt?.trim() || "local service business";
  const focus = toTitleCase(
    prompt.length > 80 ? `${prompt.slice(0, 77)}...` : prompt,
  );

  const audience =
    prompt.length > 0
      ? `Built for ${prompt.toLowerCase()} owners`
      : "Built for busy small business owners";

  const headline =
    focus.length > 0
      ? `${focus} landing in minutes`
      : "Launch a simple landing in minutes";

  const subhead =
    prompt.length > 0
      ? `Paste your focus (${prompt}) and ship a clean, credible landing without an agency or endless revisions.`
      : "Drop a short prompt and get a ready-to-share landing page that keeps the main thing the main thing.";

  const callToAction =
    prompt.length > 0
      ? "Generate my landing"
      : "Start with a 30-second prompt";

  const features = [
    `Clear story: what you do for ${prompt || "customers"} in one scroll.`,
    "Mobile-ready hero with CTA that drives calls or bookings.",
    "Trust signals and benefits copy you can tweak in-line.",
    "Shareable preview link to get sign-off fast.",
  ];

  return {
    headline,
    subhead,
    audience,
    features: prompt ? features : defaultFeatures,
    callToAction,
    prompt: prompt || "busy small business owners",
  };
};

