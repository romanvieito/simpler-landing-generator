import { NextResponse } from "next/server";

import { generateLandingContent } from "@/lib/generator";

export const runtime = "edge";

export async function POST(request: Request) {
  const { prompt } = (await request.json().catch(() => ({}))) as {
    prompt?: string;
  };

  const content = generateLandingContent(typeof prompt === "string" ? prompt : "");

  return NextResponse.json(content);
}

