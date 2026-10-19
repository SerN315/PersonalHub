# PersonalHub

A personal dashboard: clock, todos, sticky notes, pomodoro and weather widgets on a draggable grid.
Next.js 16 front-end for [PersonalHub-Back](../PersonalHub-Back).

```bash
npm install
cp .env.example .env.local   # set API_ORIGIN (http://localhost:5000 for local)
npm run dev                  # http://localhost:3000
```

`API_ORIGIN` is required for a production build (`npm run build`): the `/api` rewrite is fixed at build time.

## How it talks to the backend

The browser only ever calls this site. `/api/*` is forwarded to `API_ORIGIN` by a Next rewrite, so the session cookies
are first-party and the backend address, keys and CORS never reach the page. All calls go through
[`src/app/apis/http.ts`](src/app/apis/http.ts) (JSON, readable errors, one place that reacts to an expired session).
Nothing about the signed-in user is stored in the browser: it is asked from the server on every load.

## Security

* [`src/proxy.ts`](src/proxy.ts) sets a per-request nonce **Content-Security-Policy** (no inline scripts, `connect-src 'self'`,
  no framing) and redirects `/dashboard` to the login page when there is no session cookie.
* [`next.config.ts`](next.config.ts) adds `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and HSTS,
  and hides `X-Powered-By`.
* No secrets are shipped to the browser: Supabase keys and the weather key live only in the backend, and weather is
  fetched through `/api/weather/*`.
* Avatars load from Supabase Storage; set `IMAGE_ORIGINS` to your project's origin to tighten the default `*.supabase.co`.
