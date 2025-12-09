import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { generateLandingContent } from "@/lib/generator";

export const runtime = "edge";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt } = (await request.json().catch(() => ({}))) as {
    prompt?: string;
  };

  const content = generateLandingContent(typeof prompt === "string" ? prompt : "");

  return NextResponse.json(content);
}

