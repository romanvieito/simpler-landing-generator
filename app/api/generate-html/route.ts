// app/api/generate-html/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { chatText } from '@/lib/deepseek';
import { deductCredits, ensureCreditsTable, ensureCreditTransactionsTable } from '@/lib/db';
import { analytics } from '@/lib/mixpanel';

export async function POST(req: Request) {
  const authResult = await auth();
  let userId = authResult.userId;

  // In development, use a test user ID if not authenticated
  if (!userId && process.env.NODE_ENV === 'development') {
    userId = 'test_user_development';
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ensure credit tables exist
    await ensureCreditsTable();
    await ensureCreditTransactionsTable();

    const { plan } = await req.json();

const system = `You are an expert web designer creating stunning, high-converting landing pages.

DESIGN PRINCIPLES:
- Purposeful simplicity: Every element earns its place
- Generous whitespace: Let content breathe (80-120px section padding on desktop, 40-60px mobile)
- Typography hierarchy: Large, confident headlines (48-72px desktop); comfortable body text (16-18px)
- Subtle depth: Soft shadows, gentle gradients, layered elements
- Motion: Fade-in animations on scroll, smooth hover transitions (0.3s ease)
- Color restraint: Use accent color sparingly for CTAs and highlights
- Premium feel: High-quality spacing, refined details, polished interactions

TECHNICAL REQUIREMENTS:
- Output complete HTML: <!doctype html><html><head><style>...</style></head><body>...</body></html>
- Use inline <style> in <head> only; import Google Fonts via @import
- Use plan.designSystem for colors, typography, and effects
- Mobile-first responsive design (320px+)
- Accessibility: WCAG AA contrast, semantic HTML, alt text
- Smooth scroll behavior: scroll-behavior: smooth on html
- All text must wrap properly: word-wrap: break-word; overflow-wrap: break-word

SECTION ORDER (9 sections, generate ALL in this exact order):
1. Hero section - Full-width with gradient background, social proof, dual CTAs
2. Problem section - Empathy-driven pain points
3. Features section - 3-4 benefit cards with icons
4. Testimonials section - 3 customer quotes in cards
5. Audience section - Who this is for
6. How It Works section - 3 numbered steps
7. FAQ section - Accordion-style Q&A
8. Final CTA section - Urgency-driven closing with guarantee
9. Contact section - Clean form

REQUIRED CSS:
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in-up { animation: fadeInUp 0.8s ease-out; }

.cta-button {
  display: inline-block;
  padding: 16px 32px;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
}
.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}
.cta-button-primary {
  background: var(--color-accent);
  color: white;
}
.cta-button-secondary {
  background: transparent;
  border: 2px solid var(--color-text);
  color: var(--color-text);
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
}

.testimonial-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  position: relative;
}
.testimonial-card::before {
  content: '"';
  font-size: 80px;
  color: var(--color-accent);
  opacity: 0.2;
  position: absolute;
  top: 10px;
  left: 20px;
  line-height: 1;
}

.faq-item {
  border-bottom: 1px solid rgba(0,0,0,0.1);
  padding: 20px 0;
}
.faq-question {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: var(--color-text);
}
.faq-answer {
  color: var(--color-muted);
  line-height: 1.7;
}

.social-proof {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  opacity: 0.9;
}
.trust-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 24px;
}
.trust-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  opacity: 0.8;
}`;

    const user = `JSON plan for the page:
${JSON.stringify(plan, null, 2)}

CRITICAL INSTRUCTIONS:
Generate HTML for ALL 9 sections in this exact order. Use the exact content from the plan.

=== 1. HERO SECTION (plan.sectionsContent.hero) ===
- Full-width section with gradient background using plan.designSystem.palette
- Center-aligned content with max-width container
- Structure:
  * Social proof line at top (plan.sectionsContent.hero.socialProof)
  * Large headline (h1)
  * Subhead paragraph
  * Two CTA buttons side by side: primary and secondary
  * Trust badges row below CTAs
- Primary CTA: <a href="#contact-section" class="cta-button cta-button-primary">${plan.sectionsContent?.hero?.primaryCta || 'Get Started'}</a>
- Secondary CTA: <a href="#how-it-works" class="cta-button cta-button-secondary">${plan.sectionsContent?.hero?.secondaryCta || 'Learn More'}</a>
- If plan.images exists, use first image as subtle background with overlay
- Padding: 100-140px vertical on desktop, 60-80px mobile

=== 2. PROBLEM SECTION (plan.sectionsContent.problem) ===
- Light gray or off-white background for contrast
- Centered title and description
- Display 3 pain points as a clean list or grid
- Each pain point: icon (warning/frustration emoji) + text
- Use empathetic, second-person language
- Add visual separators between points

=== 3. FEATURES SECTION (plan.sectionsContent.features) ===
- Section title: "What You Get" or similar
- Responsive grid: 3-4 cards (grid on desktop, stack on mobile)
- Each card: large emoji icon, bold title (h3), description paragraph
- Cards have subtle shadow, hover lift effect
- White background with accent borders

=== 4. TESTIMONIALS SECTION (plan.sectionsContent.testimonials) ===
- Section title: "What Others Say" or "Success Stories"
- 3 testimonial cards in responsive grid
- Each testimonial card:
  * Large quote mark decoration (CSS ::before)
  * Quote text in italics
  * Author name (bold)
  * Author role (muted color)
- Cards have subtle shadow, generous padding

=== 5. AUDIENCE SECTION (plan.sectionsContent.audience) ===
- Section title and description from plan
- 3 segments in responsive grid (3 cols desktop, 1 col mobile)
- Each segment: title (bold, the pain point), description (how you solve it)
- Clean card design with left accent border

=== 6. HOW IT WORKS SECTION (plan.sectionsContent.howItWorks) ===
- Section ID: id="how-it-works"
- Section title: "How It Works"
- 3 numbered steps in horizontal flow (desktop) or vertical (mobile)
- Each step: large colored number circle, title (h3), description
- Visual connectors between steps (dotted line or arrow)
- Alternating background color

=== 7. FAQ SECTION (plan.sectionsContent.faq) ===
- Section title: "Frequently Asked Questions"
- 4 FAQ items in single column, max-width 800px centered
- Each FAQ: question (bold, larger font), answer (normal weight, muted)
- Simple accordion-like styling with borders
- No JavaScript needed - show all expanded

=== 8. FINAL CTA SECTION (plan.sectionsContent.finalCta) ===
- Full-width section with accent color background or gradient
- Centered content with large headline
- Subhead paragraph
- Single prominent CTA button (white on accent)
- Guarantee text below button in smaller font
- Create visual urgency with bold styling

=== 9. CONTACT SECTION (plan.sectionsContent.contact) ===
- Section ID: id="contact-section"
- Use this EXACT structure:

<section id="contact-section" class="contact-section" style="padding: 80px 20px; background: #f9fafb;">
  <div class="container" style="max-width: 600px; margin: 0 auto;">
    <h2 style="text-align: center; margin-bottom: 32px; font-size: 2rem;">${plan.sectionsContent?.contact?.title || 'Get in Touch'}</h2>
    <div id="success-message" style="display:none; padding: 1.5rem; background: #10b981; color: white; border-radius: 12px; margin-bottom: 1.5rem; text-align: center;">
      ✓ Thank you! Your message has been sent successfully.
    </div>
    <div id="error-message" style="display:none; padding: 1.5rem; background: #ef4444; color: white; border-radius: 12px; margin-bottom: 1.5rem;"></div>
    <form action="{{SITE_ID_PLACEHOLDER}}" method="POST" id="contact-form" class="contact-form" style="display: flex; flex-direction: column; gap: 20px;">
      <label style="display: flex; flex-direction: column; gap: 6px; font-weight: 500;">
        ${plan.sectionsContent?.contact?.nameLabel || 'Name'}
        <input type="text" name="name" required style="padding: 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
      </label>
      <label style="display: flex; flex-direction: column; gap: 6px; font-weight: 500;">
        ${plan.sectionsContent?.contact?.emailLabel || 'Email'}
        <input type="email" name="email" required style="padding: 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
      </label>
      <label style="display: flex; flex-direction: column; gap: 6px; font-weight: 500;">
        ${plan.sectionsContent?.contact?.messageLabel || 'Message'}
        <textarea name="message" rows="5" required style="padding: 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 1rem; resize: vertical;"></textarea>
      </label>
      <button type="submit" class="submit-button" style="padding: 16px 32px; background: var(--color-accent, #3B82F6); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">${plan.sectionsContent?.contact?.submitLabel || 'Send Message'}</button>
    </form>
  </div>
</section>

=== DESIGN SYSTEM USAGE ===
- Import Google Fonts: @import url('https://fonts.googleapis.com/css2?family=${(plan.designSystem?.typography?.heading || 'Inter').replace(/ /g, '+')}:wght@600;700&family=${(plan.designSystem?.typography?.body || 'Inter').replace(/ /g, '+')}:wght@400;500&display=swap');
- Use plan.designSystem.palette for all colors
- borderRadius: sharp=4px, modern=8px, organic=16px, pill=9999px
- Use plan.designSystem.effects.gradientStyle for hero background

=== CONTENT RULES ===
- Use EXACT text from plan.sectionsContent - do not modify or improvise
- All icons from plan.sectionsContent.features[].icon (emoji icons)
- All numbers from plan.sectionsContent.howItWorks[].number
- All testimonial quotes, names, and roles exactly as provided

=== CONTACT FORM SCRIPT (include at end of body) ===
<script>
(function () {
  'use strict';
  const successMsg = document.getElementById('success-message');
  const errorMsg = document.getElementById('error-message');
  const form = document.getElementById('contact-form');

  function showSuccess() {
    if (errorMsg) errorMsg.style.display = 'none';
    if (successMsg) { successMsg.style.display = 'block'; successMsg.setAttribute('aria-live', 'polite'); }
    if (form) form.style.display = 'none';
  }

  function showError(text) {
    if (!errorMsg) return;
    errorMsg.textContent = text || 'Something went wrong. Please try again.';
    errorMsg.style.display = 'block';
    errorMsg.setAttribute('aria-live', 'assertive');
  }

  function hideError() { if (errorMsg) errorMsg.style.display = 'none'; }

  if (window.location.search.includes('submitted=true')) {
    showSuccess();
    try { const url = new URL(window.location); url.searchParams.delete('submitted'); window.history.replaceState({}, '', url); } catch (e) {}
    return;
  }

  if (!form) return;
  form.setAttribute('data-js-intercepted', 'true');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (form.hasAttribute('data-submitting')) return;
    form.setAttribute('data-submitting', 'true');

    try {
      hideError();
      const formData = new FormData(form);
      const payload = {
        name: String(formData.get('name') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        message: String(formData.get('message') || '').trim(),
      };

      if (!payload.name || !payload.email || !payload.message) { showError('Please fill in all fields.'); return; }
      if (!payload.email.includes('@')) { showError('Please enter a valid email address.'); return; }

      let actionUrl = form.action || '/api/contact/placeholder';
      if (!actionUrl.startsWith('http')) actionUrl = window.location.origin + actionUrl;

      const resp = await fetch(actionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(function () { return null; });
      if (!resp.ok) { showError((data && data.error) || "Request failed (" + resp.status + ")"); return; }
      showSuccess();
      try { if (typeof mixpanel !== 'undefined' && mixpanel.track) { mixpanel.track('Contact Form Submitted', { success: true, site_id: 'placeholder' }); } } catch (e) {}
    } catch (err) {
      console.error('Contact form submission error:', err);
      showError('Network error. Please check your connection and try again.');
    } finally {
      form.removeAttribute('data-submitting');
    }
  });

  const inputs = form.querySelectorAll('input, textarea');
  inputs.forEach(function(input) {
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
  });
})();
</script>

Return ONLY the complete HTML document (no markdown, no fences).`;

    const response = await chatText(system, user);
    const html = response.content;

    // Charge fixed $0.20 per site for HTML generation
    const htmlCost = 0.20; // Fixed price per landing page

    // Enhanced cost logging for monitoring
    console.log(`💰 HTML Generation Cost: User ${userId}, Tokens: ${response.usage.prompt_tokens} prompt + ${response.usage.completion_tokens} completion, API Cost: $${response.cost.toFixed(6)}, Charged: $${htmlCost.toFixed(2)}`);

    try {
      await deductCredits({
        userId,
        amount: htmlCost,
        description: `Landing page generation: $0.20 (tokens: ${response.usage.prompt_tokens}/${response.usage.completion_tokens})`
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

    // Use design system from plan if available
    const designSystem = {
      palette: {
        primary: plan?.designSystem?.palette?.primary || plan?.palette?.primary || '#111827',
        secondary: plan?.designSystem?.palette?.secondary || plan?.palette?.secondary || '#6B7280',
        accent: plan?.designSystem?.palette?.accent || plan?.palette?.accent || '#3B82F6',
        background: plan?.designSystem?.palette?.background || plan?.palette?.background || '#FFFFFF',
        text: plan?.designSystem?.palette?.text || plan?.palette?.text || '#111827',
        muted: plan?.designSystem?.palette?.muted || plan?.palette?.muted || '#9CA3AF'
      },
      typography: {
        heading: plan?.designSystem?.typography?.heading || plan?.fonts?.heading || 'Inter',
        body: plan?.designSystem?.typography?.body || plan?.fonts?.body || 'Inter'
      },
      effects: plan?.designSystem?.effects || {
        borderRadius: 'modern',
        shadows: 'subtle',
        gradientStyle: 'none'
      }
    };

    const fullHtml = /<html[\s\S]*<\/html>/i.test(html)
      ? html
      : `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${plan?.title ?? 'Landing'}</title>
<script src="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"></script>
<script>
  if (typeof mixpanel !== 'undefined') {
    mixpanel.init('${process.env.NEXT_PUBLIC_MIXPANEL_TOKEN}', {
      track_pageview: true,
      persistence: 'localStorage'
    });
    mixpanel.track('Site Viewed', {
      site_id: 'placeholder',
      site_title: '${plan?.title ?? 'Landing'}'
    });
  }

  // Track CTA clicks
  function trackCTAClick(ctaText, location) {
    if (typeof mixpanel !== 'undefined') {
      mixpanel.track('CTA Clicked', {
        cta_text: ctaText,
        location: location,
        site_id: 'placeholder'
      });
    }
  }

  // Add click tracking to CTA elements after page loads
  document.addEventListener('DOMContentLoaded', function() {
    // Track buttons with CTA-like text (but don't interfere with functionality)
    document.querySelectorAll('button, a, input[type="submit"]').forEach(function(el) {
      var text = el.textContent || el.value || el.innerText || '';
      if (text && (text.toLowerCase().includes('get') ||
                   text.toLowerCase().includes('start') ||
                   text.toLowerCase().includes('join') ||
                   text.toLowerCase().includes('sign up') ||
                   text.toLowerCase().includes('contact') ||
                   text.toLowerCase().includes('learn more'))) {
        el.addEventListener('click', function(e) {
          // Only track if not already handled by other logic
          if (!e.defaultPrevented) {
            trackCTAClick(text.trim(), window.location.pathname);
          }
        }, { passive: true });
      }
    });

    // Track form submissions (but don't interfere)
    document.querySelectorAll('form').forEach(function(form) {
      // Skip forms that are already handled by our contact form script
      if (form.id === 'contact-form') return;

      form.addEventListener('submit', function(e) {
        if (!e.defaultPrevented) {
          trackCTAClick('Form Submitted', window.location.pathname);
        }
      }, { passive: true });
    });
  });
</script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=${designSystem.typography.heading.replace(/ /g, '+')}:wght@600;700&family=${designSystem.typography.body.replace(/ /g, '+')}:wght@400;500&display=swap');
  
  :root {
    --color-primary: ${designSystem.palette.primary};
    --color-secondary: ${designSystem.palette.secondary};
    --color-accent: ${designSystem.palette.accent};
    --color-bg: ${designSystem.palette.background};
    --color-text: ${designSystem.palette.text};
    --color-muted: ${designSystem.palette.muted};
  }
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { 
    margin: 0; 
    padding: 0; 
    background: var(--color-bg); 
    color: var(--color-text); 
    font-family: '${designSystem.typography.body}', system-ui, sans-serif;
    line-height: 1.6;
  }
  * { word-wrap: break-word; overflow-wrap: break-word; }
  img { max-width: 100%; height: auto; display: block; }
  a { color: var(--color-primary); text-decoration: none; }
  .container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
  h1, h2, h3, h4, h5, h6 { 
    font-family: '${designSystem.typography.heading}', system-ui, sans-serif;
    font-weight: 700;
    line-height: 1.2;
  }
</style>
</head>
<body>
${html}
</body>
</html>`;

    return NextResponse.json({ html: fullHtml });
  } catch (e: any) {
    console.error(e);
    analytics.errorOccurred('html_generation_failed', e?.message ?? 'Unknown error', {
      userId: userId || 'unknown',
      endpoint: 'generate-html'
    });
    return NextResponse.json({ error: e?.message ?? 'Failed to generate HTML' }, { status: 500 });
  }
}
