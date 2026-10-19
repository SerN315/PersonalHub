// One place for talking to the API: same-origin (Next rewrites /api to the backend), cookies attached,
// JSON in and out, and a readable Error for every failure.

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

const SIGNED_OUT_EVENT = "personalhub:signed-out";

// Anything can listen for this to react to an expired session (UserRegistry does).
export const onSignedOut = (handler: () => void) => {
  window.addEventListener(SIGNED_OUT_EVENT, handler);
  return () => window.removeEventListener(SIGNED_OUT_EVENT, handler);
};

type Options = { method?: string; body?: unknown; form?: FormData };

export async function api<T = unknown>(path: string, { method = "GET", body, form }: Options = {}): Promise<T> {
  const init: RequestInit = { method, credentials: "same-origin" };
  if (form) {
    init.body = form;
  } else if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    // A 401 on a normal call means the session is gone; the login form itself handles its own 401s.
    if (res.status === 401 && !path.startsWith("/api/login")) window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}
