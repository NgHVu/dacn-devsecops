import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
    // [FIX QUAN TRỌNG] Cập nhật tên Service cho đúng với tên trong K8s (foodhub-dev-...)
    
    // 1. Products Service (Port 8081)
    const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || "http://foodhub-prod-products:8081";
    
    // 2. Users Service (Port 8082)
    const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://foodhub-prod-users:8082";
    
    // 3. Orders Service (Port 8083)
    const ORDERS_SERVICE_URL = process.env.ORDERS_SERVICE_URL || "http://foodhub-prod-orders:8083";

    console.log("--> REWRITE RULES LOADED:");
    console.log(`Products URL: ${PRODUCTS_SERVICE_URL}`);
    console.log(`Users URL: ${USERS_SERVICE_URL}`);

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
        // Chú ý: Orders Service có thêm /api/v1
        destination: `${ORDERS_SERVICE_URL}/api/v1/orders/:path*`, 
      },
    ];
  },
};

export default nextConfig;