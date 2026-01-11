// app/layout.tsx
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import Script from 'next/script';
import { MixpanelProvider } from '@/components/mixpanel-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Landing Generator',
  description: 'AI-powered landing page generator',
  icons: {
    icon: '/globe.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <MixpanelProvider>
        <html lang="en">
          <head>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=AW-16510475658`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'AW-16510475658');
              `}
            </Script>
          </head>
          <body>
            {children}
          </body>
        </html>
      </MixpanelProvider>
    </ClerkProvider>
  );
}
