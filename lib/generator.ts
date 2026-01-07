import Anthropic from "@anthropic-ai/sdk";

export type GeneratedPlanFeature = {
  title: string;
  description?: string;
};

export type GeneratedPlan = {
  name: string;
  price: string;
  description?: string;
  features: GeneratedPlanFeature[];
  cta?: string;
  badge?: string;
};

export type GeneratedTestimonial = {
  quote: string;
  name: string;
  role?: string;
};

export type GeneratedSections = {
  hero: {
    headline: string;
    subhead: string;
    primaryCta: string;
  };
  audience: {
    title: string;
    description: string;
  };
  contact: {
    title: string;
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    submitLabel: string;
  };
};

export type GeneratedLanding = {
  headline: string;
  subhead: string;
  audience: string;
  features: string[];
  callToAction: string;
  prompt: string;
  style?: string;
  sections?: string[];
  imagePrompt?: string;
  imageAlt?: string;
  palette?: string;
  tone?: string;
  sectionsContent: GeneratedSections;
};

export type GenerationRequest = {
  prompt: string;
  style?: string;
  sections?: string[];
};

const defaultFeatures = [
  "Simple hero section with clear offer",
  "Audience section showing target customers",
  "Contact form with name, email, and message fields",
];

const anthropic =
  process.env.ANTHROPIC_API_KEY?.trim()?.length && typeof fetch !== "undefined"
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;
const CLAUDE_MODEL = "claude-haiku-4-5"; // Dont change this model, it's the best one for this use case.

const deriveBrand = (prompt: string) => {
  const cleaned = prompt.replace(/[^a-zA-Z0-9\s&'-]/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "Launch Studio";
  const words = cleaned.split(" ").slice(0, 3);
  return toTitleCase(words.join(" ")).slice(0, 40) || "Launch Studio";
};

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ")
    .trim();

const buildPrompt = ({ prompt, style, sections }: GenerationRequest) => {
  const trimmed = prompt?.trim() || "local service business";
  const brand = deriveBrand(trimmed);
  const styleLine = style ? `Style: ${style}.` : "Style: modern, minimal.";
  const sectionsLine =
    sections && sections.length > 0
      ? `Sections to emphasize (keep this order): ${sections.join(", ")}. Must include a CTA and contact form.`
      : "Sections to emphasize: Hero, Audience, Contact form.";

  return [
    "You write concise, conversion-focused landing page copy with one clear CTA and a simple contact form.",
    `Brand name to use everywhere: ${brand}. Focus/offer: ${trimmed}.`,
    styleLine,
    sectionsLine,
    "CRITICAL: Only generate content for these 3 sections: hero, audience, and contact form. Do NOT generate testimonials, or any other sections.",
    "Return raw JSON only (no markdown, no code fences, no commentary).",
    "Required keys: headline, subhead, audience, callToAction, features (array), prompt, imagePrompt, imageAlt, palette, tone, sectionsContent.",
    "sectionsContent shape: hero {headline, subhead, primaryCta}, audience {title, description}, contact {title, nameLabel, emailLabel, messageLabel, submitLabel}. Keep it short and simple.",
    "Constraints: headline must include the brand; callToAction is 2-5 words and points to booking/contact; features are 3 short benefit bullets.",
    "Add a concise hero imagePrompt plus a 3-6 word imageAlt; keep them generic and safe.",
    "Tone: clear, benefit-led, avoid fluff. If unsure, make reasonable assumptions while keeping output usable.",
  ].join(" ");
};

const safeParseCompletion = (text: string) => {
  const withoutFences = text.replace(/```json|```/g, "").trim();
  const match = withoutFences.match(/\{[\s\S]*\}/);
  const candidate = match ? match[0] : withoutFences;
  try {
    return JSON.parse(candidate) as Partial<GeneratedLanding>;
  } catch {
    return null;
  }
};

const normalizeFeatures = (value: unknown, fallback: string[]) => {
  if (Array.isArray(value)) {
    const trimmed = value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    if (trimmed.length > 0) {
      return trimmed.slice(0, 6);
    }
  }
  return fallback;
};

const normalizeCallToAction = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/[^a-zA-Z0-9\s'!&.-]/g, "").trim();
  if (cleaned.length < 3) return fallback;
  const words = cleaned.split(/\s+/);
  const normalized = words.length > 8 ? `${words.slice(0, 7).join(" ")}...` : cleaned;
  return normalized;
};

const ensureContactSupport = (features: string[]) => {
  const hasContact = features.some((item) =>
    /contact|book|call|schedule|reply|support/i.test(item),
  );
  if (hasContact) return features;
  return [...features.slice(0, 3), "Contact or booking link is included for visitors not ready to buy"];
};

const buildFallbackContent = ({ prompt, style, sections }: GenerationRequest): GeneratedLanding => {
  const cleanedPrompt = prompt?.trim() || "local service business";
  const brand = deriveBrand(cleanedPrompt);
  const focus = toTitleCase(
    cleanedPrompt.length > 80 ? `${cleanedPrompt.slice(0, 77)}...` : cleanedPrompt,
  );

  const audience =
    cleanedPrompt.length > 0
      ? `Built for ${cleanedPrompt.toLowerCase()} owners`
      : "Built for busy small business owners";

  const headline =
    focus.length > 0
      ? `${focus} landing in minutes`
      : "Launch a simple landing in minutes";

  const subhead =
    cleanedPrompt.length > 0
      ? `Describe ${cleanedPrompt} and get a simple landing with hero, audience, and contact form.`
      : "Describe your offer and get a clean landing with hero, audience, and contact form.";

  const callToAction = cleanedPrompt.length > 0 ? "Generate landing" : "Start with a 30-second prompt";

  const features = [
    `Clear hero section explaining ${cleanedPrompt || "the offer"}.`,
    "Audience section showing who this is for.",
    "Simple contact form with name, email, and message.",
  ];

  const sectionsContent: GeneratedSections = {
    hero: {
      headline: `${brand} — ${headline}`,
      subhead,
      primaryCta: callToAction,
    },
    audience: {
      title: "Who this is for",
      description: audience,
    },
    contact: {
      title: "Get in touch",
      nameLabel: "Name",
      emailLabel: "Email",
      messageLabel: "Message",
      submitLabel: "Send message",
    },
  };

  return {
    headline: `${brand} - ${headline}`,
    subhead,
    audience,
    features: cleanedPrompt ? features : defaultFeatures,
    callToAction,
    prompt: cleanedPrompt || "busy small business owners",
    style,
    sections,
    imagePrompt: `Hero photo of ${brand} serving ${cleanedPrompt || "customers"}, bright and inviting.`,
    imageAlt: `${brand} hero image`,
    palette: style ? `${style} palette` : "Modern palette with high contrast and neutrals",
    tone: "Clear, confident, benefit-led",
    sectionsContent,
  };
};

export const generateLandingContent = async (
  input: GenerationRequest,
): Promise<GeneratedLanding> => {
  const fallback = buildFallbackContent(input);

  if (!anthropic) {
    return fallback;
  }

  try {
    const completion = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      temperature: 0.7,
      messages: [{ role: "user", content: buildPrompt(input) }],
    });

    const text = completion.content
      .map((part) => ("text" in part ? part.text : ""))
      .join("\n");
    const parsed = safeParseCompletion(text);

    if (!parsed) return fallback;

    const mergedFeatures = ensureContactSupport(normalizeFeatures(parsed.features, fallback.features));

    return {
      headline: parsed.headline?.trim()
        ? parsed.headline.trim()
        : `${deriveBrand(input.prompt || fallback.prompt)} - ${fallback.headline}`,
      subhead: parsed.subhead?.trim() || fallback.subhead,
      audience: parsed.audience?.trim() || fallback.audience,
      features: mergedFeatures,
      callToAction: normalizeCallToAction(parsed.callToAction, fallback.callToAction),
      prompt: parsed.prompt?.trim() || fallback.prompt,
      style: input.style ?? parsed.style ?? fallback.style,
      sections: input.sections?.length ? input.sections : parsed.sections ?? fallback.sections,
      imagePrompt: parsed.imagePrompt?.trim() || fallback.imagePrompt,
      imageAlt: parsed.imageAlt?.trim() || fallback.imageAlt,
      palette: parsed.palette?.trim() || fallback.palette,
      tone: parsed.tone?.trim() || fallback.tone,
      sectionsContent: parsed.sectionsContent ?? fallback.sectionsContent,
    };
  } catch {
    return fallback;
  }
};

