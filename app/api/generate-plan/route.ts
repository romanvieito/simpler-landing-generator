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

    const system = `You are an expert landing page designer inspired by Jonathan Ive's design philosophy: purposeful simplicity, emotional resonance, and premium aesthetics.

Analyze the business description and generate a complete landing page plan as a single JSON object.

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
      "primaryCta": string
    },
    "features": [
      {
        "icon": string,
        "title": string,
        "description": string
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

DESIGN SYSTEM GUIDELINES:
Analyze the business type and intelligently select a design archetype:
- Tech/SaaS: Sharp geometry, blue-purple palettes (#3B82F6, #8B5CF6), fonts like "Space Grotesk" or "Inter", modern shadows
- Health/Wellness: Organic shapes, earth tones (#2D5016, #C17F59), fonts like "Playfair Display" or "Source Sans 3", soft shadows
- Professional Services: Navy/gold accents (#1E3A8A, #D97706), fonts like "Libre Baskerville" or "Source Serif 4", structured
- Creative/Agency: Bold contrasts (#EF4444, #10B981), fonts like "Unbounded" or "Manrope", dynamic
- Local/Artisan: Warm palettes (#92400E, #F59E0B), fonts like "Cormorant" or "Lora", textured feel
- E-commerce/Retail: Clean whites (#FFFFFF), vibrant accents (#EC4899), fonts like "DM Sans" or "Inter", product-focused

MOOD: One word describing the aesthetic (e.g., "serene-organic", "bold-tech", "warm-artisan", "clean-professional")

TYPOGRAPHY: Choose Google Fonts that match the mood. Heading and body should pair well.

EFFECTS:
- borderRadius: "sharp" (2-4px), "modern" (8-12px), "organic" (16-24px), "pill" (full rounded)
- shadows: "none", "subtle", "soft", "pronounced"
- gradientStyle: "none", "warm-fade", "cool-fade", "vibrant", "subtle"

CONTENT RULES:
- Generate content for exactly 5 sections: hero, features, audience, howItWorks, contact
- Keep copy concise, benefit-focused, and authentic. NO placeholder text like "Lorem"
- Hero: Compelling headline with brand name, clear value prop subhead, action-oriented CTA (2-4 words)
- Features: Exactly 3-4 benefit cards. Icon = single emoji. Title = 2-4 words. Description = 8-15 words explaining the benefit
- Audience: Title + description of who this serves. Segments = exactly 3 pain/solution pairs. Title = pain point, Description = how you solve it
- How It Works: Exactly 3 numbered steps. Title = action (2-4 words), Description = what happens (8-12 words)
- Contact: Contextual form labels and submit button text
- Images: 2-3 image search queries for hero visuals (generic, safe, relevant)

ACCESSIBILITY: Ensure color contrast meets WCAG AA standards (4.5:1 for text)`;

    const user = `Business description:
"""
${description}
"""

Analyze this business and generate a complete landing page plan with an AI-driven design system that perfectly matches the business type and creates a unique, premium aesthetic.

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
