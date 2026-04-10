import type { NextConfig } from "next";

const rawBackendUrl =
  process.env.BACKEND_URL || "https://personalhub-back.onrender.com";
const backendUrl = rawBackendUrl.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
