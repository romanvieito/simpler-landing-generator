// app/api/generate-html/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { chatText } from '@/lib/deepseek';
import { deductCredits } from '@/lib/db';

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Deduct credits for HTML generation (1 credit)
    try {
      await deductCredits({
        userId,
        amount: 1,
        description: 'Landing page HTML generation'
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

    const { plan } = await req.json();

    const system = `You generate complete, mobile-responsive HTML documents with inline CSS only. CRITICAL REQUIREMENTS:
- Output a single complete HTML document: <!doctype html><html>...<head>...<style>... and <body>...</body></html>.
- Use inline <style> in <head>; do not import external CSS or fonts.
- Use provided color palette and font names (fallback to system fonts).
- Layout: modern, clean, responsive. Use semantic sections.
- Images: use provided image URLs if available; otherwise omit images.
- Accessibility: sufficient contrast, alt text for images, logical headings.
- Keep copy exactly as provided in the plan; do not add placeholders.
- Include smooth responsive behavior for mobile first.
- No scripts unless strictly necessary. No analytics, no external links except CTAs provided.

Generate ONLY these 3 sections in this exact order:
1. Hero section (with headline, subhead, primary CTA button)
2. Audience section (with title and description)
3. Contact form section (with the provided form fields)

DO NOT add testimonials, or any other sections. Only these 3 sections.`;

    const user = `JSON plan for the page:
${JSON.stringify(plan, null, 2)}

CRITICAL INSTRUCTIONS:
- Generate HTML for ONLY these 3 sections in this exact order:
  1. Hero section using plan.sectionsContent.hero
  2. Audience section using plan.sectionsContent.audience
  3. Contact form section using plan.sectionsContent.contact

- Use the exact content from plan.sectionsContent - do not modify or add to it

IMPORTANT: For the contact form, use this exact format:
<div id="contact-section">
  <div id="success-message" style="display:none; padding: 1rem; background: #10b981; color: white; border-radius: 0.5rem; margin-bottom: 1rem;">
    ✓ Thank you! Your message has been sent successfully.
  </div>
  <form action="{{SITE_ID_PLACEHOLDER}}" method="POST" id="contact-form">
    <label>${plan.sectionsContent?.contact?.nameLabel || 'Name'} <input type="text" name="name" required></label>
    <label>${plan.sectionsContent?.contact?.emailLabel || 'Email'} <input type="email" name="email" required></label>
    <label>${plan.sectionsContent?.contact?.messageLabel || 'Message'} <textarea name="message" required></textarea></label>
    <button type="submit">${plan.sectionsContent?.contact?.submitLabel || 'Send Message'}</button>
  </form>
</div>

<script>
// Show success message if redirected back with submitted=true
if (window.location.search.includes('submitted=true')) {
  const successMsg = document.getElementById('success-message');
  const form = document.getElementById('contact-form');
  if (successMsg) successMsg.style.display = 'block';
  if (form) form.style.display = 'none';
}
</script>

The action URL will be replaced with the actual site ID when saved.

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
