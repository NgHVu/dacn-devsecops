import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // [QUAN TRỌNG] Kích hoạt standalone mode để tối ưu Docker Image
  output: 'standalone',

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
    const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || "http://localhost:8081";
    const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:8082";
    const ORDERS_SERVICE_URL = process.env.ORDERS_SERVICE_URL || "http://localhost:8083";

    return [
      // --- USERS SERVICE ---
      {
        source: '/api/auth/:path*',
        destination: `${USERS_SERVICE_URL}/api/auth/:path*`,
      },
      {
        source: '/api/users/:path*',
        destination: `${USERS_SERVICE_URL}/api/users/:path*`,
      },

      // --- PRODUCTS SERVICE ---
      {
        source: '/api/products/:path*',
        destination: `${PRODUCTS_SERVICE_URL}/api/products/:path*`,
      },
      {
        source: '/api/categories/:path*',
        destination: `${PRODUCTS_SERVICE_URL}/api/categories/:path*`,
      },
      {
        source: "/api/reviews/:path*",
        destination: `${PRODUCTS_SERVICE_URL}/api/reviews/:path*`,
      },

      // --- ORDERS SERVICE ---
      {
        source: '/api/orders/:path*',
        destination: `${ORDERS_SERVICE_URL}/api/v1/orders/:path*`,
      },
    ];
  },
};

export default nextConfig;