// app/api/generate-html/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { chatText } from '@/lib/deepseek';
import { deductCredits, ensureCreditsTable, ensureCreditTransactionsTable } from '@/lib/db';
import { analytics } from '@/lib/mixpanel';

export async function POST(req: Request) {
  // Skip authentication in development for easier testing
  const isDevelopment = process.env.NODE_ENV === 'development';
  const { userId } = isDevelopment ? { userId: 'dev-user' } : await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ensure credit tables exist
    await ensureCreditsTable();
    await ensureCreditTransactionsTable();

    const { plan } = await req.json();

const system = `You are an expert web designer creating stunning, conversion-optimized landing pages inspired by Jonathan Ive's design philosophy.

DESIGN PRINCIPLES (Ive-Inspired):
- Purposeful simplicity: Every element earns its place
- Generous whitespace: Let content breathe (80-120px section padding on desktop, 40-60px mobile)
- Typography hierarchy: Large, confident headlines (48-72px desktop); comfortable body text (16-18px)
- Subtle depth: Soft shadows (0 4px 20px rgba(0,0,0,0.08)), gentle gradients, layered elements
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

SECTION ORDER (5 sections, generate ALL):
1. Hero section - Full-width with gradient/image background, centered content
2. Features section - 3-4 benefit cards in responsive grid with icons
3. Audience section - Problem/solution pairs showing empathy
4. How It Works section - 3 numbered steps with visual flow
5. Contact section - Clean form with subtle background differentiation

REQUIRED CSS ANIMATIONS:
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in-up { animation: fadeInUp 0.8s ease-out; }

BUTTON HOVER EFFECT:
.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

CARD HOVER EFFECT:
.feature-card:hover, .step-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
}`;

    const user = `JSON plan for the page:
${JSON.stringify(plan, null, 2)}

CRITICAL INSTRUCTIONS:
Generate HTML for ALL 5 sections in this exact order:

1. HERO SECTION (plan.sectionsContent.hero)
   - Full-width section with gradient background using plan.designSystem.palette
   - Centered content: headline (h1), subhead (p), primary CTA button
   - CTA button MUST be: <a href="#contact-section" class="cta-button">${plan.sectionsContent.hero.primaryCta}</a>
   - If plan.images exists, optionally include hero image with overlay
   - Padding: 100-120px vertical on desktop, 60-80px mobile

2. FEATURES SECTION (plan.sectionsContent.features)
   - Section title: "Features" or contextual variant
   - Responsive grid: 3-4 cards (grid on desktop, stack on mobile)
   - Each card: icon (modern SVG), title (h3), description (p)
   - Cards have subtle shadow, hover lift effect
   - Background: slightly different from hero (use secondary color)

3. AUDIENCE SECTION (plan.sectionsContent.audience)
   - Section title and description from plan
   - 3 segments in responsive grid (3 cols desktop, 1 col mobile)
   - Each segment: title (bold, pain point), description (solution)
   - Clean card design with borders

4. HOW IT WORKS SECTION (plan.sectionsContent.howItWorks)
   - Section title: "How It Works" or similar
   - 3 numbered steps in horizontal flow (desktop) or vertical (mobile)
   - Each step: large number, title (h3), description (p)
   - Visual connectors between steps (optional arrows/lines)

5. CONTACT SECTION (plan.sectionsContent.contact)
   - Section title from plan
   - Form with name, email, message fields
   - Use this exact structure:


<section id="contact-section" class="contact-section">
  <div class="container">
    <h2>${plan.sectionsContent.contact.title}</h2>
    <div id="success-message" style="display:none; padding: 1.5rem; background: #10b981; color: white; border-radius: 12px; margin-bottom: 1.5rem; text-align: center;">
      ✓ Thank you! Your message has been sent successfully.
    </div>
    <div id="error-message" style="display:none; padding: 1.5rem; background: #ef4444; color: white; border-radius: 12px; margin-bottom: 1.5rem;"></div>
    <form action="{{SITE_ID_PLACEHOLDER}}" method="POST" id="contact-form" class="contact-form">
      <label>
        ${plan.sectionsContent.contact.nameLabel}
        <input type="text" name="name" required>
      </label>
      <label>
        ${plan.sectionsContent.contact.emailLabel}
        <input type="email" name="email" required>
      </label>
      <label>
        ${plan.sectionsContent.contact.messageLabel}
        <textarea name="message" rows="5" required></textarea>
      </label>
      <button type="submit" class="submit-button">${plan.sectionsContent.contact.submitLabel}</button>
    </form>
  </div>
</section>

DESIGN SYSTEM USAGE:
- Import Google Fonts: @import url('https://fonts.googleapis.com/css2?family=${(plan.designSystem?.typography?.heading || plan.fonts?.heading || 'Inter').replace(/ /g, '+')}:wght@600;700&family=${(plan.designSystem?.typography?.body || plan.fonts?.body || 'Inter').replace(/ /g, '+')}:wght@400;500&display=swap');
- Use plan.designSystem.palette or plan.palette for all colors
- Apply plan.designSystem.effects.borderRadius (convert to px: sharp=4px, modern=8px, organic=16px, pill=9999px) or use 'modern' as default
- Apply plan.designSystem.effects.shadows (convert to CSS shadow values) or use 'subtle' as default
- Use plan.designSystem.effects.gradientStyle for hero background or 'none' as default

EXACT CONTENT:
- Use exact text from plan.sectionsContent - do not modify, add, or improvise
   - All icons from plan.sectionsContent.features[].icon (modern SVG icons)
- All numbers from plan.sectionsContent.howItWorks[].number

<script>
// Contact form UX:
// - If redirected back with submitted=true, show success and hide form
// - Otherwise, intercept submit and POST via fetch() so the page doesn't navigate
(function () {
  'use strict';

  const successMsg = document.getElementById('success-message');
  const errorMsg = document.getElementById('error-message');
  const form = document.getElementById('contact-form');

  function showSuccess() {
    if (errorMsg) errorMsg.style.display = 'none';
    if (successMsg) {
      successMsg.style.display = 'block';
      successMsg.setAttribute('aria-live', 'polite');
    }
    if (form) form.style.display = 'none';
  }

  function showError(text) {
    if (!errorMsg) return;
    errorMsg.textContent = text || 'Something went wrong. Please try again.';
    errorMsg.style.display = 'block';
    errorMsg.setAttribute('aria-live', 'assertive');
  }

  function hideError() {
    if (errorMsg) errorMsg.style.display = 'none';
  }

  // Check for success parameter on page load
  if (window.location.search.includes('submitted=true')) {
    showSuccess();
    // Clean up the URL parameter
    try {
      const url = new URL(window.location);
      url.searchParams.delete('submitted');
      window.history.replaceState({}, '', url);
    } catch (e) {
      // Ignore URL manipulation errors
    }
    return;
  }

  if (!form) {
    console.warn('Contact form not found');
    return;
  }

  // Ensure form doesn't submit traditionally
  form.setAttribute('data-js-intercepted', 'true');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    e.stopPropagation();

    // Prevent double submission
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

      // Basic client-side validation
      if (!payload.name || !payload.email || !payload.message) {
        showError('Please fill in all fields.');
        return;
      }

      if (!payload.email.includes('@')) {
        showError('Please enter a valid email address.');
        return;
      }

      // Get the form action URL, fallback to a reasonable default
      let actionUrl = form.action || '/api/contact/placeholder';
      if (!actionUrl.startsWith('http')) {
        // Convert relative URL to absolute
        actionUrl = window.location.origin + actionUrl;
      }

      const resp = await fetch(actionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(function () { return null; });

      if (!resp.ok) {
        showError((data && data.error) || "Request failed (" + resp.status + ")");
        return;
      }

      showSuccess();

      // Track successful submission
      try {
        if (typeof mixpanel !== 'undefined' && mixpanel.track) {
          mixpanel.track('Contact Form Submitted', {
            success: true,
            site_id: 'placeholder'
          });
        }
      } catch (trackingError) {
        // Ignore tracking errors
      }

    } catch (err) {
      console.error('Contact form submission error:', err);
      showError('Network error. Please check your connection and try again.');
    } finally {
      form.removeAttribute('data-submitting');
    }
  });

  // Prevent accidental form submission on enter key in non-textarea inputs
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

The action URL will be replaced with the actual site ID when saved.

Return ONLY the HTML (no markdown, no fences).`;

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
  mixpanel.init('${process.env.NEXT_PUBLIC_MIXPANEL_TOKEN}', {
    track_pageview: true,
    persistence: 'localStorage'
  });
  mixpanel.track('Site Viewed', {
    site_id: 'placeholder',
    site_title: '${plan?.title ?? 'Landing'}'
  });

  // Track CTA clicks
  function trackCTAClick(ctaText, location) {
    mixpanel.track('CTA Clicked', {
      cta_text: ctaText,
      location: location,
      site_id: 'placeholder'
    });
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
