// app/api/generate-plan/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { chatJSON } from '@/lib/deepseek';
import { fetchImageForQuery } from '@/lib/pexels';
import { extractJSON } from '@/lib/utils';
import { deductCredits, ensureCreditsTable, ensureCreditTransactionsTable } from '@/lib/db';

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

    const { description, style = 'Professional' } = await req.json();

    const system = `You are an expert conversion copywriter and landing page designer. Your goal is to create landing pages that HOOK visitors immediately and guide them to take action.

Analyze the business description and generate a complete, high-converting landing page plan as a single JSON object.

REQUIRED JSON STRUCTURE:
{
  "title": string,
  "designSystem": {
    "mood": string,
    "palette": {
      "primary": string,
      "secondary": string,
      "accent": string,
      "background": string,
      "text": string,
      "muted": string
    },
    "typography": {
      "heading": string,
      "body": string,
      "style": string
    },
    "effects": {
      "borderRadius": string,
      "shadows": string,
      "gradientStyle": string
    }
  },
  "sectionsContent": {
    "hero": {
      "headline": string,
      "subhead": string,
      "primaryCta": string,
      "secondaryCta": string,
      "socialProof": string,
      "trustBadges": [string, string, string]
    },
    "problem": {
      "title": string,
      "description": string,
      "painPoints": [string, string, string]
    },
    "features": [
      {
        "icon": string,
        "title": string,
        "description": string
      }
    ],
    "testimonials": [
      {
        "quote": string,
        "name": string,
        "role": string
      }
    ],
    "audience": {
      "title": string,
      "description": string,
      "segments": [
        {
          "title": string,
          "description": string
        }
      ]
    },
    "howItWorks": [
      {
        "number": number,
        "title": string,
        "description": string
      }
    ],
    "faq": [
      {
        "question": string,
        "answer": string
      }
    ],
    "finalCta": {
      "headline": string,
      "subhead": string,
      "cta": string,
      "guarantee": string
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

=== COPYWRITING PRINCIPLES (CRITICAL) ===

Use the PAS Framework throughout:
- PROBLEM: Acknowledge the pain/frustration the visitor feels
- AGITATE: Make them feel the cost of inaction
- SOLUTION: Present your offer as the clear answer

Power words to use: "instantly", "proven", "guaranteed", "exclusive", "effortless", "transform", "discover", "unlock", "finally"

Focus on TRANSFORMATION, not features. Show the before vs. after states.

=== HERO SECTION (THE HOOK) ===

The headline MUST follow one of these proven patterns:
1. "[Achieve X] in [Timeframe] — Without [Common Objection]"
   Example: "Get a Professional Website in 10 Minutes — Without Coding or Design Skills"
2. "The [Adjective] Way to [Desired Outcome]"
   Example: "The Effortless Way to Launch Your Online Presence"
3. "[Stop/End] [Pain Point]. [Start/Get] [Desired State]."
   Example: "Stop Losing Customers. Start Converting Visitors."

Hero requirements:
- headline: 8-15 words, specific outcome, includes brand feeling
- subhead: 15-25 words, expands on the promise, addresses "how" briefly
- primaryCta: 2-4 action words (e.g., "Get Started Free", "Book Your Call", "Try It Now")
- secondaryCta: 2-4 words for hesitant visitors (e.g., "See How It Works", "View Examples", "Learn More")
- socialProof: Credibility statement (e.g., "Trusted by 500+ businesses", "Join 10,000+ happy customers", "Rated 4.9/5 by users")
- trustBadges: 3 short trust indicators (e.g., "No credit card required", "Cancel anytime", "24/7 support")

=== PROBLEM SECTION ===

Show empathy. Make visitors feel understood.
- title: Relatable question or statement (e.g., "Sound familiar?", "Tired of...")
- description: 1 sentence acknowledging shared frustration
- painPoints: Exactly 3 specific pain points written in second person ("You..."). Be specific, not generic.

=== FEATURES SECTION ===

Focus on benefits, not features. Each feature should answer "So what? Why do I care?"
- Exactly 3-4 benefit cards
- icon: Single emoji that represents the benefit
- title: 2-4 words, benefit-focused
- description: 10-18 words explaining the tangible outcome

=== TESTIMONIALS SECTION ===

Testimonials MUST:
- Sound authentic (use casual language, specific details, realistic imperfections)
- Address a common objection indirectly
- Include a concrete result OR emotional transformation
- Have realistic names and roles matching the target audience

Generate exactly 3 testimonials:
- One about ease/speed ("I was surprised how quickly...")
- One about results/outcomes ("My business has seen...")
- One about value/worth ("Best investment I've made...")

=== AUDIENCE SECTION ===

- title: "Who This Is For" or similar
- description: Clear statement of ideal customer
- segments: Exactly 3 problem/solution pairs. Title = pain they feel, Description = how you solve it

=== HOW IT WORKS SECTION ===

Make the process feel simple and achievable.
- Exactly 3 steps
- Each step: number, title (2-4 words, action verb), description (8-15 words)
- Use words like "Simply", "Just", "Then" to emphasize ease

=== FAQ SECTION ===

Answer objections before they become deal-breakers.
Generate exactly 4 FAQs addressing:
1. Time/effort concern ("How long does it take?")
2. Skill/ability concern ("Do I need experience?")
3. Flexibility/control concern ("Can I customize/change it?")
4. Risk/commitment concern ("What if it doesn't work?")

Keep answers concise (2-3 sentences), reassuring, and benefit-focused.

=== FINAL CTA SECTION ===

Create urgency and reduce friction.
- headline: Action-oriented, emphasizes "now" or "today"
- subhead: Address final hesitation, reinforce value
- cta: Same as primary CTA or stronger variant
- guarantee: Risk-reversal statement (e.g., "100% satisfaction guaranteed", "No commitment required", "Full refund within 30 days")

=== CONTACT SECTION ===

Contextual labels matching the business type.
- title: Inviting heading (e.g., "Let's Talk", "Get in Touch", "Start the Conversation")
- Form labels should feel personal, not corporate

=== DESIGN SYSTEM ===

Analyze the business type and select appropriate design:
- Tech/SaaS: Sharp geometry, blue-purple palettes (#3B82F6, #8B5CF6), fonts like "Space Grotesk" or "Inter"
- Health/Wellness: Organic shapes, earth tones (#2D5016, #C17F59), fonts like "Playfair Display" or "Source Sans 3"
- Professional Services: Navy/gold accents (#1E3A8A, #D97706), fonts like "Libre Baskerville" or "Source Serif 4"
- Creative/Agency: Bold contrasts (#EF4444, #10B981), fonts like "Unbounded" or "Manrope"
- Local/Artisan: Warm palettes (#92400E, #F59E0B), fonts like "Cormorant" or "Lora"
- E-commerce/Retail: Clean whites (#FFFFFF), vibrant accents (#EC4899), fonts like "DM Sans" or "Inter"

EFFECTS:
- borderRadius: "sharp" (2-4px), "modern" (8-12px), "organic" (16-24px), "pill" (full rounded)
- shadows: "none", "subtle", "soft", "pronounced"
- gradientStyle: "none", "warm-fade", "cool-fade", "vibrant", "subtle"

=== IMAGES ===

Generate 2-3 image search queries for hero/background visuals. Keep them generic, professional, and safe.

=== ACCESSIBILITY ===

Ensure color contrast meets WCAG AA standards (4.5:1 for text)`;

    const user = `Business description:
"""
${description}
"""

Style preference: ${style}

Create a high-converting landing page plan for this business. Focus on:
1. A compelling HOOK in the hero that immediately captures attention
2. Authentic testimonials that address common objections
3. Clear transformation messaging (before → after)
4. Strong calls-to-action with urgency

Generate ALL 9 sections: hero, problem, features, testimonials, audience, howItWorks, faq, finalCta, contact.

Return ONLY the JSON object, no markdown, no commentary.`;

    // Generate plan (free - cost charged during HTML generation)
    const planResponse = await chatJSON(system, user);

    // Log API usage for monitoring (but don't charge)
    console.log(`📋 Plan Generation (FREE): User ${userId}, Tokens: ${planResponse.usage.prompt_tokens} prompt + ${planResponse.usage.completion_tokens} completion, API Cost: $${planResponse.cost.toFixed(6)}`);

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
