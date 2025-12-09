import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Simpler Landing Generator of the World",
  description:
    "Turn a quick prompt into a launch-ready landing page built for busy small business owners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: "#0f766e" },
      }}
    >
      <html lang="en">
        <body
          className={`${inter.variable} ${geistMono.variable} antialiased bg-black text-white`}
        >
          <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
            <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="text-sm font-semibold tracking-tight text-white hover:text-[#9cc2ff]"
                >
                  Simpler Landing Generator
                </Link>
                <Link
                  href="/app"
                  className="text-xs font-semibold text-neutral-300 transition hover:text-white"
                >
                  Workspace
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <SignedOut>
                  <SignInButton>
                    <button className="rounded-full border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:border-white/40 hover:bg-white/10">
                      Sign in
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>
          </div>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
