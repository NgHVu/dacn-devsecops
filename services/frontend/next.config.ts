import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  async rewrites() {
    return [
      // Users Service
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:8082/api/auth/:path*',
      },
      {
        source: '/api/users/:path*',
        destination: 'http://localhost:8082/api/users/:path*',
      },

      // Products Service
      {
        source: '/api/products/:path*',
        destination: 'http://localhost:8081/api/products/:path*',
      },
      {
        source: '/api/categories/:path*',
        destination: 'http://localhost:8081/api/categories/:path*',
      },

      // Orders Service 
      {
        source: '/api/orders/:path*',
        destination: 'http://localhost:8083/api/v1/orders/:path*',
      },
    ];
  },
};

export default nextConfig;