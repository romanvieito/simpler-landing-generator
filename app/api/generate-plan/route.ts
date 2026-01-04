// app/api/generate-plan/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { chatJSON } from '@/lib/deepseek';
import { fetchImageForQuery } from '@/lib/pexels';
import { extractJSON } from '@/lib/utils';
import { deductCredits, ensureCreditsTable, ensureCreditTransactionsTable } from '@/lib/db';

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ensure credit tables exist
    await ensureCreditsTable();
    await ensureCreditTransactionsTable();

    // Deduct credits for plan generation (1 credit)
    try {
      await deductCredits({
        userId,
        amount: 1,
        description: 'Landing page plan generation'
      });
    } catch (error: any) {
      if (error.message === 'Insufficient credits') {
        return NextResponse.json(
          { error: 'Insufficient credits. Please purchase more credits to continue.' },
          { status: 402 }
        );
      }
      throw error;
    }

    const { description, style = 'Professional' } = await req.json();

    const styleGuidelines: Record<string, string> = {
      Professional: 'Use clean lines, corporate colors (blues, grays), structured layouts, and formal tone. Emphasize trust and credibility.',
      Creative: 'Use bold colors, unique layouts, playful fonts, and engaging visuals. Emphasize innovation and originality.',
      Friendly: 'Use warm colors (oranges, yellows, soft blues), rounded corners, casual tone, and approachable imagery. Emphasize warmth and accessibility.',
      Minimalist: 'Use lots of white space, monochromatic or limited color palette, simple typography, and clean design. Emphasize simplicity and clarity.'
    };

    const system = `You are a landing page design planner. Output strictly a single JSON object that includes:
{
  "title": string,
  "palette": { "primary": string, "secondary": string, "background": string, "text": string, "accent": string },
  "fonts": { "heading": string, "body": string },
  "sections": [
    {
      "type": "hero" | "features" | "about" | "testimonials" | "pricing" | "gallery" | "cta" | "footer",
      "heading": string?,
      "subheading": string?,
      "body": string?,
      "items": [{ "title": string?, "body": string? }]?,
      "cta": { "label": string, "url": string? }?,
      "imageQuery": string?
    }
  ],
  "images": [{ "query": string }]
}
Rules:
- Provide 5-7 total sections with reasonable defaults for a modern startup landing page.
- Keep copy concise and friendly. Avoid placeholder words like 'Lorem'.
- Use accessible color contrast; prefer neutral background and clear text color.
- Include up to 3 image queries for hero/gallery/feature visuals.
- Design Style: ${styleGuidelines[style as keyof typeof styleGuidelines] || styleGuidelines.Professional}`;

    const user = `Business description:
"""
${description}
"""
Return ONLY the JSON.`;

    const raw = await chatJSON(system, user);
    const jsonText = extractJSON(raw);
    const plan = JSON.parse(jsonText);

    const imageSet: Array<{ query: string; url: string }> = [];
    const queries: string[] = [
      ...(plan?.images?.map((i: any) => i.query) ?? []),
      ...(plan?.sections?.map((s: any) => s.imageQuery).filter(Boolean) ?? []),
    ];
    const uniqueQueries = Array.from(new Set(queries)).slice(0, 5);

    for (const q of uniqueQueries) {
      const url = await fetchImageForQuery(q);
      if (url) imageSet.push({ query: q, url });
    }

    if (plan?.sections) {
      plan.sections = plan.sections.map((s: any) => {
        if (s.imageQuery) {
          const hit = imageSet.find((i) => i.query === s.imageQuery);
          if (hit) s.imageUrl = hit.url;
        }
        return s;
      });
    }
    plan.images = imageSet;

    return NextResponse.json({ plan });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to generate plan' }, { status: 500 });
  }
}
