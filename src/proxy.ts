import { NextRequest, NextResponse } from "next/server";

const isDev = process.env.NODE_ENV === "development";

// Pages that need a session. The cookie is only checked for presence here (an early, cheap redirect);
// the backend verifies it on every API call, so a forged cookie opens an empty page and nothing else.
const PROTECTED = ["/dashboard", "/todo"];

// Where avatars are served from (Supabase Storage). Override with IMAGE_ORIGINS="https://<ref>.supabase.co".
const imageOrigins = process.env.IMAGE_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? [
  "https://*.supabase.co",
];

function contentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Stylesheets come from files; the nonce covers the few <style> tags. Inline style="" attributes
    // (React style props, react-grid-layout positions) are allowed separately and can't run script.
    `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "style-src-attr 'unsafe-inline'",
    `img-src 'self' blob: data: ${imageOrigins.join(" ")}`,
    "font-src 'self'",
    "connect-src 'self'", // the browser only ever talks to this site; /api is proxied to the backend
    "media-src 'self' https: blob:", // radio streams come from thousands of different stations (https only; audio cannot run code)
    "frame-src https://www.youtube-nocookie.com https://www.youtube.com", // YouTube's official player, nothing else may be framed
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsSession = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasSession = request.cookies.has("access_token") || request.cookies.has("refresh_token");
  if (needsSession && !hasSession) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: skip the API rewrite, build assets, and anything with a file extension in /public.
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
