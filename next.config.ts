import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://personalhub-back.onrender.com///api/:path*",
      },
    ];
  },
};

export default nextConfig;
//https://personalhub-back.onrender.com///api/:path* (server test)
//http://localhost:5000///api/:path* ( local test )
