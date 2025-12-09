import { LandingPreview } from "@/components/landing-preview";
import { generateLandingContent } from "@/lib/generator";

type PreviewPageProps = {
  searchParams: Promise<{
    prompt?: string;
  }>;
};

export default async function PreviewPage({ searchParams }: PreviewPageProps) {
  const params = await searchParams;
  const prompt = typeof params.prompt === "string" ? params.prompt : "";
  const content = generateLandingContent(prompt);

  return (
    <main className="min-h-screen bg-black px-6 pb-20 pt-14 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9cc2ff]">
            Preview link
          </p>
          <h1 className="text-3xl font-semibold text-white">Shareable landing preview</h1>
          <p className="text-sm text-neutral-300">
            This is the production-style preview generated from your prompt. Update the prompt on the homepage to refresh this link.
          </p>
        </div>
        <LandingPreview content={content} showHeader={false} />
      </div>
    </main>
  );
}

