import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  async rewrites() {
    return [
      // Điều hướng /api/auth/** -> users-service (Port 8082)
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:8082/api/auth/:path*',
      },
      // Điều hướng /api/users/** -> users-service (Port 8082)
      {
        source: '/api/users/:path*', 
        destination: 'http://localhost:8082/api/users/:path*',
      },
      
      // Điều hướng /api/products/** -> products-service (Port 8081)
      {
        source: '/api/products/:path*',
        destination: 'http://localhost:8081/api/products/:path*',
      },
      
      // Điều hướng /api/orders/** -> orders-service (Port 8083)
      {
        source: '/api/orders/:path*', 
        destination: 'http://localhost:8083/api/v1/orders/:path*',
      },
    ];
  },
};

export default nextConfig;