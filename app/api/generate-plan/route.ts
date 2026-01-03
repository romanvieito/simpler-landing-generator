// app/api/generate-plan/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { chatJSON } from '@/lib/deepseek';
import { fetchImageForQuery } from '@/lib/pexels';
import { extractJSON } from '@/lib/utils';

export async function POST(req: Request) {
  const { userId } = await auth();

  try {
    const { description } = await req.json();

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
- Include up to 3 image queries for hero/gallery/feature visuals.`;

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
