import Anthropic from "@anthropic-ai/sdk";

export type GeneratedLanding = {
  headline: string;
  subhead: string;
  audience: string;
  features: string[];
  callToAction: string;
  prompt: string;
  style?: string;
  sections?: string[];
};

export type GenerationRequest = {
  prompt: string;
  style?: string;
  sections?: string[];
};

const defaultFeatures = [
  "Clear hero with just one CTA",
  "Benefits-first copy in plain language",
  "Contact/booking actions that work on mobile",
];

const anthropic =
  process.env.ANTHROPIC_API_KEY?.trim()?.length && typeof fetch !== "undefined"
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;
const CLAUDE_MODEL = "claude-haiku-4-5"; // Dont change this model, it's the best one for this use case.

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ")
    .trim();

const buildPrompt = ({ prompt, style, sections }: GenerationRequest) => {
  const trimmed = prompt?.trim() || "local service business";
  const styleLine = style ? `Style: ${style}.` : "Style: modern, minimal.";
  const sectionsLine =
    sections && sections.length > 0
      ? `Sections to emphasize: ${sections.join(", ")}.`
      : "Sections to emphasize: Hero, Features, and just one CTA.";

  return [
    "You write concise, conversion-focused landing page copy.",
    `Focus: ${trimmed}.`,
    styleLine,
    sectionsLine,
    "Return JSON only. No code fences, no markdown, no commentary.",
    `Keys: headline, subhead, audience, callToAction.`,
    "Tone: clear, benefit-led, with just one primary action.",
    "If unsure, make reasonable assumptions to keep output useful.",
  ].join(" ");
};

const safeParseCompletion = (text: string) => {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned) as Partial<GeneratedLanding>;
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

const buildFallbackContent = ({ prompt, style, sections }: GenerationRequest): GeneratedLanding => {
  const cleanedPrompt = prompt?.trim() || "local service business";
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
      ? `Describe ${cleanedPrompt} and get a crisp landing with one CTA, benefits, and proof.`
      : "Describe your offer and get a clean landing with a single CTA and proof point.";

  const callToAction = cleanedPrompt.length > 0 ? "Generate landing" : "Start with a 30-second prompt";

  const features = [
    `Hero that states the offer for ${cleanedPrompt || "customers"} in one line.`,
    "Three benefit bullets and a proof slot.",
    "Primary CTA plus a contact/booking backup.",
  ];

  return {
    headline,
    subhead,
    audience,
    features: cleanedPrompt ? features : defaultFeatures,
    callToAction,
    prompt: cleanedPrompt || "busy small business owners",
    style,
    sections,
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

    return {
      headline: parsed.headline?.trim() || fallback.headline,
      subhead: parsed.subhead?.trim() || fallback.subhead,
      audience: parsed.audience?.trim() || fallback.audience,
      features: normalizeFeatures(parsed.features, fallback.features),
      callToAction: parsed.callToAction?.trim() || fallback.callToAction,
      prompt: parsed.prompt?.trim() || fallback.prompt,
      style: input.style ?? parsed.style ?? fallback.style,
      sections: input.sections?.length ? input.sections : parsed.sections ?? fallback.sections,
    };
  } catch {
    return fallback;
  }
};

