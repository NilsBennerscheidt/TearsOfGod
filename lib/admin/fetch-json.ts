/**
 * Shared JSON fetch helper for the admin UI's client components
 * (app/admin/news, app/admin/shows, app/admin/media). Every admin route
 * returns `{ error: string }` on failure (see formatZodError / the
 * adminGuard 404 body) — this throws that message instead of letting a
 * bare `res.json()` destructure hand back `undefined` fields to the
 * caller, which previously left the UI stuck on "Loading…" or crashing
 * on `undefined.length` when a request failed.
 */
export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = json && typeof json === "object" && "error" in json ? String(json.error) : res.statusText;
    throw new Error(message || `Request failed with ${res.status}`);
  }

  return json as T;
}
