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
  const content = await generateLandingContent({ prompt });

  return <LandingPreview content={content} showHeader={false} />;
}

