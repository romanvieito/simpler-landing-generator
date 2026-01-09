// app/api/generate-html/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { chatText } from '@/lib/deepseek';
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

    const { plan } = await req.json();

    const system = `You generate complete, mobile-responsive HTML documents with inline CSS only. CRITICAL REQUIREMENTS:
|- Output a single complete HTML document: <!doctype html><html>...<head>...<style>... and <body>...</body></html>.
|- Use inline <style> in <head>; do not import external CSS or fonts.
|- Use provided color palette and font names (fallback to system fonts).
|- Layout: modern, clean, responsive. Use semantic sections.
|- Images: use provided image URLs if available; otherwise omit images. For hero images, use class="hero-image" for proper sizing.
|- Accessibility: sufficient contrast, alt text for images, logical headings.
|- Keep copy exactly as provided in the plan; do not add placeholders.
|- Include smooth responsive behavior for mobile first.
|- No scripts unless strictly necessary. No analytics, no external links except CTAs provided.
|- CRITICAL TEXT HANDLING: All text content must be fully visible and NOT cut off or hidden.
  * Use word-wrap: break-word; and overflow-wrap: break-word; for all text containers.
  * Ensure headlines, paragraphs, and all text can wrap properly on mobile devices.
  * Avoid fixed heights on text containers that could cause text overflow.
  * Use max-width with appropriate padding to ensure text is never clipped.
  * Test that all content is readable and fully visible on narrow viewports (320px+).

Generate ONLY these 3 sections in this exact order:
1. Hero section (with headline, subhead, primary CTA button)
2. Audience section (with title, description, and the 3 problem/solution segments in a grid/list)
3. Contact form section (with the provided form fields)

DO NOT add testimonials, or any other sections. Only these 3 sections.`;

    const user = `JSON plan for the page:
${JSON.stringify(plan, null, 2)}

CRITICAL INSTRUCTIONS:
|- Generate HTML for ONLY these 3 sections in this exact order:
  1. Hero section using plan.sectionsContent.hero
  2. Audience section using plan.sectionsContent.audience. IMPORTANT: Render the 'segments' as a responsive 3-column grid (or stacked on mobile). Each segment title is the Pain Point (bold), description is the Solution.
  3. Contact form section using plan.sectionsContent.contact

|- Use the exact content from plan.sectionsContent - do not modify or add to it

IMPORTANT: For the contact form, use this exact format:
<div id="contact-section">
  <div id="success-message" style="display:none; padding: 1rem; background: #10b981; color: white; border-radius: 0.5rem; margin-bottom: 1rem;">
    ✓ Thank you! Your message has been sent successfully.
  </div>
  <div id="error-message" style="display:none; padding: 1rem; background: #ef4444; color: white; border-radius: 0.5rem; margin-bottom: 1rem;"></div>
  <form action="{{SITE_ID_PLACEHOLDER}}" method="POST" id="contact-form">
    <label>${plan.sectionsContent?.contact?.nameLabel || 'Name'} <input type="text" name="name" required></label>
    <label>${plan.sectionsContent?.contact?.emailLabel || 'Email'} <input type="email" name="email" required></label>
    <label>${plan.sectionsContent?.contact?.messageLabel || 'Message'} <textarea name="message" required></textarea></label>
    <button type="submit">${plan.sectionsContent?.contact?.submitLabel || 'Send Message'}</button>
  </form>
</div>

<script>
// Contact form UX:
// - If redirected back with submitted=true, show success and hide form
// - Otherwise, intercept submit and POST via fetch() so the page doesn't navigate
(function () {
  const successMsg = document.getElementById('success-message');
  const errorMsg = document.getElementById('error-message');
  const form = document.getElementById('contact-form');

  function showSuccess() {
    if (errorMsg) errorMsg.style.display = 'none';
    if (successMsg) successMsg.style.display = 'block';
    if (form) form.style.display = 'none';
  }

  function showError(text) {
    if (!errorMsg) return;
    errorMsg.textContent = text || 'Something went wrong. Please try again.';
    errorMsg.style.display = 'block';
  }

  if (window.location.search.includes('submitted=true')) {
    showSuccess();
    return;
  }

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      if (errorMsg) errorMsg.style.display = 'none';

      const formData = new FormData(form);
      const payload = {
        name: String(formData.get('name') || ''),
        email: String(formData.get('email') || ''),
        message: String(formData.get('message') || ''),
      };

      const resp = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(function () { return null; });
      if (!resp.ok) {
        showError((data && data.error) || 'Failed to send message.');
        return;
      }

      showSuccess();
    } catch (err) {
      showError('Network error. Please try again.');
    }
  });
})();
</script>

The action URL will be replaced with the actual site ID when saved.

Return ONLY the HTML (no markdown, no fences).`;

    const response = await chatText(system, user);
    const html = response.content;

    // Deduct credits based on API cost for HTML generation
    try {
      await deductCredits({
        userId,
        amount: response.cost,
        description: `Landing page HTML generation (API cost: $${(response.cost / 100).toFixed(4)})`
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
  * { word-wrap: break-word; overflow-wrap: break-word; }
  img { max-width: 100%; height: auto; display: block; object-fit: cover; }
  .hero-image { max-height: 400px; width: 100%; object-fit: cover; border-radius: 8px; }
  a { color: var(--color-primary); text-decoration: none; }
  .container { width: 100%; max-width: 1100px; margin: 0 auto; padding: 16px; }
  h1, h2, h3, h4, h5, h6, p { margin: 0; padding: 0; }
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
