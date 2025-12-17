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
    // URL của các service backend (ưu tiên lấy từ biến môi trường, fallback về localhost)
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
      // [QUAN TRỌNG] Thêm đoạn này để map API Reviews sang Products Service
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