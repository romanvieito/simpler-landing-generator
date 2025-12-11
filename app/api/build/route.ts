import { NextResponse } from "next/server";
import JSZip from "jszip";
import { auth } from "@clerk/nextjs/server";

import { generateLandingContent, type GeneratedLanding } from "@/lib/generator";

export const runtime = "nodejs";

const buildHtml = (content: GeneratedLanding) => {
  const { sectionsContent, imagePrompt, imageAlt } = content;
  const hero = sectionsContent.hero;
  const benefits = sectionsContent.benefits;
  const contact = sectionsContent.contact;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${hero.headline}</title>
  <style>
    :root {
      --bg: #f6f8fb;
      --text: #0f172a;
      --muted: #475569;
      --accent: #2563eb;
      --card: #ffffff;
      --border: #e2e8f0;
      --radius: 14px;
      font-family: "Inter", system-ui, -apple-system, sans-serif;
    }
    * { box-sizing: border-box; }
    body { margin:0; background: var(--bg); color: var(--text); }
    .wrap { max-width: 960px; margin: 0 auto; padding: 32px 18px 48px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; box-shadow: 0 12px 36px -24px rgba(15,23,42,0.25); }
    h1,h2,h3 { margin:0 0 10px; }
    p { margin:0 0 12px; line-height:1.6; color: var(--muted); }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; color: var(--muted); font-size: 12px; }
    .btn-row { display:flex; gap:10px; flex-wrap:wrap; margin-top: 10px; }
    .btn { padding: 11px 16px; border-radius: 999px; font-weight: 700; text-decoration: none; display:inline-flex; align-items:center; justify-content:center; gap:8px; border:1px solid transparent; transition: all .12s ease; }
    .btn-primary { background: var(--accent); color: #fff; box-shadow: 0 10px 30px -20px rgba(37,99,235,.8); }
    .btn-secondary { background: #e2e8f0; color: var(--text); border-color: var(--border); }
    .pill { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background:#e0f2fe; color:#075985; font-weight:700; font-size:12px; letter-spacing:0.05em; }
    .list { list-style: disc; padding-left: 20px; margin: 0 0 12px; color: var(--muted); }
    footer { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content: space-between; font-size:14px; color: var(--muted); }
    footer a { color: var(--text); text-decoration:none; }
    footer a:hover { text-decoration: underline; }
    .img-note { border:1px dashed var(--border); border-radius:12px; padding:10px; font-size:13px; color: var(--muted); }
    @media (max-width: 640px) {
      .btn { width: 100%; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card" style="margin-bottom:18px;">
      ${hero.badge ? `<span class="pill">${hero.badge}</span>` : ""}
      <p class="eyebrow">${hero.eyebrow ?? ""}</p>
      <h1>${hero.headline}</h1>
      <p>${hero.subhead}</p>
      <div class="btn-row">
        <a class="btn btn-primary" href="#cta">${hero.primaryCta}</a>
        ${hero.secondaryCta ? `<a class="btn btn-secondary" href="#contact">${hero.secondaryCta}</a>` : ""}
      </div>
      <div class="img-note" style="margin-top:12px;">
        <strong>Hero image prompt:</strong> ${imagePrompt || "Bright, simple hero image"}<br/>
        Alt: ${imageAlt || "Hero image"}
      </div>
    </div>

    <div class="card" style="margin-bottom:18px;">
      <h2>${benefits.title}</h2>
      <p>Benefits generated from your prompt:</p>
      <ul class="list">
        ${benefits.bullets.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </div>

    <div id="contact" class="card" style="margin-bottom:18px;">
      <h2>${contact.title}</h2>
      <p>${contact.description ?? ""}</p>
      <form class="grid" style="gap:10px; margin-top:10px;">
        <label style="display:grid; gap:6px; font-size:14px;">
          <span style="font-weight:700; color:var(--text);">${contact.nameLabel}</span>
          <input type="text" name="name" placeholder="Jane Doe" style="padding:10px 12px; border:1px solid var(--border); border-radius:10px; font-size:15px;" />
        </label>
        <label style="display:grid; gap:6px; font-size:14px;">
          <span style="font-weight:700; color:var(--text);">${contact.emailLabel}</span>
          <input type="email" name="email" placeholder="you@example.com" style="padding:10px 12px; border:1px solid var(--border); border-radius:10px; font-size:15px;" />
        </label>
        <label style="display:grid; gap:6px; font-size:14px;">
          <span style="font-weight:700; color:var(--text);">${contact.messageLabel}</span>
          <textarea name="message" rows="3" placeholder="How can we help?" style="padding:10px 12px; border:1px solid var(--border); border-radius:10px; font-size:15px;"></textarea>
        </label>
        <button type="button" class="btn btn-primary" style="justify-content:center;">${contact.submitLabel}</button>
      </form>
    </div>
  </div>
</body>
</html>`;
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { prompt?: string };
  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  const content = await generateLandingContent({ prompt });

  if (!content || !content.sectionsContent) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const zip = new JSZip();
  const html = buildHtml(content);
  zip.file("index.html", html);
  zip.file(
    "README.txt",
    `Landing bundle generated from prompt: ${content.prompt}\nIncludes hero, features, pricing, testimonials, CTA, footer.\nEdit index.html to tweak copy, links, or styles.`,
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="landing-site.zip"',
      "Content-Length": buffer.length.toString(),
    },
  });
}

