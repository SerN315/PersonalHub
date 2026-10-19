import type { NextConfig } from "next";

// Where the backend lives. The browser never sees it: it calls /api on this site and Next forwards.
//   production: API_ORIGIN=https://personalhub-back.onrender.com      local: http://localhost:5000
const configured = process.env.API_ORIGIN || process.env.BACKEND_URL; // BACKEND_URL is the older name for the same thing

if (process.env.NODE_ENV === "production" && !configured) {
  throw new Error("API_ORIGIN is not set. See .env.example.");
}
const apiOrigin = (configured ?? "http://localhost:5000").replace(/\/+$/, "");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
