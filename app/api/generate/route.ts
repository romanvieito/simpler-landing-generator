import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { generateLandingContent } from "@/lib/generator";

export const runtime = "edge";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt, style, sections } = (await request.json().catch(() => ({}))) as {
    prompt?: string;
    style?: string;
    sections?: string[];
  };

  const parsedSections =
    Array.isArray(sections) && sections.length > 0
      ? sections.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
      : undefined;

  const content = await generateLandingContent({
    prompt: typeof prompt === "string" ? prompt : "",
    style: typeof style === "string" ? style : undefined,
    sections: parsedSections,
  });

  return NextResponse.json(content);
}

