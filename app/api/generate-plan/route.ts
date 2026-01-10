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

    const { description, style = 'Professional' } = await req.json();

    const styleGuidelines: Record<string, string> = {
      Professional: 'Use clean lines, corporate colors (blues, grays), structured layouts, and formal tone. Emphasize trust and credibility.',
      Creative: 'Use bold colors, unique layouts, playful fonts, and engaging visuals. Emphasize innovation and originality.',
      Friendly: 'Use warm colors (oranges, yellows, soft blues), rounded corners, casual tone, and approachable imagery. Emphasize warmth and accessibility.',
      Minimalist: 'Use lots of white space, monochromatic or limited color palette, simple typography, and clean design. Emphasize simplicity and clarity.'
    };

    const system = `You are a landing page content generator. Output strictly a single JSON object that includes:
{
  "title": string,
  "palette": { "primary": string, "secondary": string, "background": string, "text": string, "accent": string },
  "fonts": { "heading": string, "body": string },
  "sectionsContent": {
    "hero": {
      "headline": string,
      "subhead": string,
      "primaryCta": string
    },
    "audience": {
      "title": string,
      "description": string,
      "segments": [{ "title": string, "description": string }]
    },
    "contact": {
      "title": string,
      "nameLabel": string,
      "emailLabel": string,
      "messageLabel": string,
      "submitLabel": string
    }
  },
  "images": [{ "query": string }]
}
Rules:
- Generate content for exactly 3 sections: hero, audience (who is this for), and contact form.
- Keep copy concise and friendly. Avoid placeholder words like 'Lorem'.
- Use accessible color contrast; prefer neutral background and clear text color.
- Include up to 3 image queries for hero visuals.
- Hero section: compelling headline, clear subhead, and 1 primary CTA button only.
- Audience section: title and description explaining who the landing page is for.
- Audience segments: exactly 3 items. Title = specific pain point (e.g. "Overwhelmed by X"). Description = how the offer solves it.
- Contact section: form labels and submit button text.
- Design Style: ${styleGuidelines[style as keyof typeof styleGuidelines] || styleGuidelines.Professional}`;

    const user = `Business description:
"""
${description}
"""
Return ONLY the JSON.`;

    // Deduct credits based on API cost for plan generation (2x API cost)
    const planResponse = await chatJSON(system, user);
    const apiCost = planResponse.cost;
    const planCost = apiCost * 2;

    try {
      await deductCredits({
        userId,
        amount: planCost,
        description: `Landing page plan generation (2x API cost: $${Math.max(0.01, apiCost / 100).toFixed(2)} → $${Math.max(0.01, planCost / 100).toFixed(2)})`
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

    const jsonText = extractJSON(planResponse.content);
    const plan = JSON.parse(jsonText);

    const imageSet: Array<{ query: string; url: string }> = [];
    const queries: string[] = [
      ...(plan?.images?.map((i: any) => i.query) ?? []),
      // No imageQuery in sectionsContent, only in images array
    ];
    const uniqueQueries = Array.from(new Set(queries)).slice(0, 5);

    for (const q of uniqueQueries) {
      const url = await fetchImageForQuery(q);
      if (url) imageSet.push({ query: q, url });
    }

    // Update the images array with fetched URLs
    plan.images = imageSet;
    plan.images = imageSet;

    return NextResponse.json({ plan });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to generate plan' }, { status: 500 });
  }
}
