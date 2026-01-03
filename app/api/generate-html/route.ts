// app/api/generate-html/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { chatText } from '@/lib/deepseek';

export async function POST(req: Request) {
  const { userId } = await auth();

  try {
    const { plan } = await req.json();

    const system = `You generate complete, mobile-responsive HTML documents with inline CSS only. Requirements:
- Output a single complete HTML document: <!doctype html><html>...<head>...<style>... and <body>...</body></html>.
- Use inline <style> in <head>; do not import external CSS or fonts.
- Use provided color palette and font names (fallback to system fonts).
- Layout: modern, clean, responsive. Use semantic sections.
- Images: use provided image URLs if available; otherwise omit images.
- Accessibility: sufficient contrast, alt text for images, logical headings.
- Keep copy exactly as provided in the plan; do not add placeholders.
- Include smooth responsive behavior for mobile first.
- No scripts unless strictly necessary. No analytics, no external links except CTAs provided.`;

    const user = `JSON plan for the page:
${JSON.stringify(plan, null, 2)}

Return ONLY the HTML (no markdown, no fences).`;

    const html = await chatText(system, user);

    const fullHtml = /<html[\s\S]*<\/html>/i.test(html)
      ? html
      : `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${plan?.title ?? 'Landing'}</title>
<style>
  :root {
    --color-primary: ${plan?.palette?.primary ?? '#111827'};
    --color-secondary: ${plan?.palette?.secondary ?? '#6b7280'};
    --color-bg: ${plan?.palette?.background ?? '#ffffff'};
    --color-text: ${plan?.palette?.text ?? '#111827'};
    --color-accent: ${plan?.palette?.accent ?? '#7c3aed'};
  }
  html, body { margin: 0; padding: 0; background: var(--color-bg); color: var(--color-text); font-family: ${plan?.fonts?.body ?? 'Inter, system-ui, sans-serif'}; }
  img { max-width: 100%; height: auto; display: block; }
  a { color: var(--color-primary); text-decoration: none; }
  .container { width: 100%; max-width: 1100px; margin: 0 auto; padding: 16px; }
</style>
</head>
<body>
<div class="container">
${html}
</div>
</body>
</html>`;

    return NextResponse.json({ html: fullHtml });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to generate HTML' }, { status: 500 });
  }
}
