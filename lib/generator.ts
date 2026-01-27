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

export type GeneratedFeature = {
  icon: string;
  title: string;
  description: string;
};

export type GeneratedStep = {
  number: number;
  title: string;
  description: string;
};

export type DesignSystem = {
  mood: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  typography: {
    heading: string;
    body: string;
    style: string;
  };
  effects: {
    borderRadius: string;
    shadows: string;
    gradientStyle: string;
  };
};

export type GeneratedFAQ = {
  question: string;
  answer: string;
};

export type GeneratedSections = {
  hero: {
    headline: string;
    subhead: string;
    primaryCta: string;
    secondaryCta?: string;           // For visitors not ready to commit
    socialProof?: string;            // e.g., "Trusted by 500+ businesses"
    trustBadges?: string[];          // e.g., ["10+ years experience", "100% satisfaction"]
  };
  problem?: {                        // NEW: Empathy section showing pain points
    title: string;
    description: string;
    painPoints: string[];
  };
  features: GeneratedFeature[];
  testimonials?: GeneratedTestimonial[];  // RE-ENABLED: Social proof
  audience: {
    title: string;
    description: string;
    segments?: { title: string; description: string }[];
  };
  howItWorks: GeneratedStep[];
  faq?: GeneratedFAQ[];              // NEW: Objection handling
  finalCta?: {                       // NEW: Urgency-driven closing
    headline: string;
    subhead: string;
    cta: string;
    guarantee?: string;
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
  designSystem?: DesignSystem;
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
    "sectionsContent shape: hero {headline, subhead, primaryCta}, audience {title, description, segments: [{title, description}]}, contact {title, nameLabel, emailLabel, messageLabel, submitLabel}. Keep it short and simple.",
    "Constraints: headline must include the brand; callToAction is 2-5 words and points to booking/contact; features are 3 short benefit bullets.",
    "Audience segments: Generate exactly 3 'Problem vs Solution' pairs. Title = The struggle/pain point. Description = How you solve it.",
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
      secondaryCta: "See how it works",
      socialProof: "Trusted by hundreds of businesses",
      trustBadges: ["Quick setup", "No coding required", "Cancel anytime"],
    },
    problem: {
      title: "Sound familiar?",
      description: "You're not alone. Most business owners face these challenges.",
      painPoints: [
        "Spending hours trying to build a website that looks professional",
        "Losing potential customers because you don't have an online presence",
        "Feeling overwhelmed by complicated website builders",
      ],
    },
    features: [
      {
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        title: "Fast Setup",
        description: "Get your landing page live in minutes, not hours.",
      },
      {
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        title: "Beautiful Design",
        description: "Professional, conversion-optimized layouts that work.",
      },
      {
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke="currentColor" stroke-width="2"/><path d="M12 18H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
        title: "Mobile Ready",
        description: "Looks perfect on every device, automatically.",
      },
    ],
    testimonials: [
      {
        quote: "I was dreading building a website for months. This took me 10 minutes and it looks better than anything I could have made myself.",
        name: "Sarah M.",
        role: "Small Business Owner",
      },
      {
        quote: "Finally, something that just works. No technical skills needed, and my customers love the professional look.",
        name: "James K.",
        role: "Freelance Consultant",
      },
      {
        quote: "The best investment I've made for my business this year. Simple, fast, and effective.",
        name: "Maria L.",
        role: "Local Service Provider",
      },
    ],
    audience: {
      title: "Who this is for",
      description: audience,
      segments: [
        {
          title: "Struggling with complexity",
          description: "We make it simple so you can focus on work.",
        },
        {
          title: "Wasting time on setup",
          description: "Launch in minutes, not days.",
        },
        {
          title: "Unsure where to start",
          description: "Guided process takes you from zero to live.",
        },
      ],
    },
    howItWorks: [
      {
        number: 1,
        title: "Describe your business",
        description: "Tell us what you do in a few sentences.",
      },
      {
        number: 2,
        title: "We generate your page",
        description: "AI creates a custom landing page for you.",
      },
      {
        number: 3,
        title: "Publish and share",
        description: "Go live with your own domain or subdomain.",
      },
    ],
    faq: [
      {
        question: "How long does it take to create a landing page?",
        answer: "Most users have their landing page live within 5-10 minutes. Just describe your business, review the generated page, and publish.",
      },
      {
        question: "Do I need any technical skills?",
        answer: "Not at all. If you can write a few sentences about your business, you can create a professional landing page.",
      },
      {
        question: "Can I edit the page after it's generated?",
        answer: "Yes! You can edit any text directly on the page, and regenerate sections if you want a different approach.",
      },
      {
        question: "What if I'm not satisfied with the result?",
        answer: "You can regenerate your page as many times as you like until it's perfect. We want you to love your landing page.",
      },
    ],
    finalCta: {
      headline: "Ready to launch your landing page?",
      subhead: "Join hundreds of businesses who've already taken the first step. Your professional landing page is just minutes away.",
      cta: "Get Started Now",
      guarantee: "No credit card required. Start for free.",
    },
    contact: {
      title: "Get in touch",
      nameLabel: "Name",
      emailLabel: "Email",
      messageLabel: "Message",
      submitLabel: "Send message",
    },
  };

  const designSystem: DesignSystem = {
    mood: "modern-professional",
    palette: {
      primary: "#111827",
      secondary: "#6B7280",
      accent: "#3B82F6",
      background: "#FFFFFF",
      text: "#111827",
      muted: "#9CA3AF",
    },
    typography: {
      heading: "Inter",
      body: "Inter",
      style: "clean-modern",
    },
    effects: {
      borderRadius: "modern",
      shadows: "subtle",
      gradientStyle: "none",
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
    designSystem,
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

