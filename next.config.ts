import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      // Rewrite subdomain requests to the subdomain handler
      {
        source: '/:path*',
        destination: '/api/subdomain-handler',
        has: [
          {
            type: 'host',
            value: '*.easyland.site',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
