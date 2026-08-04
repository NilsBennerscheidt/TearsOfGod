import type { NextRequest } from "next/server";

/** Sentinel distinguishing "body was not valid JSON" from any legitimate parsed value (including `null`, which `JSON.parse` accepts). */
export const INVALID_JSON = Symbol("invalid-json");

/**
 * `request.json()` throws on a malformed body (empty body, truncated
 * request, non-JSON content) — called unguarded ahead of a Zod
 * `safeParse`, that throw skips the safeParse entirely and the route
 * 500s instead of returning the same `{error}` 400 shape every other
 * validation failure produces. This folds that failure mode into the
 * same shape so every admin route can treat "invalid JSON" as just
 * another parse failure.
 */
export async function readJson(request: NextRequest): Promise<unknown | typeof INVALID_JSON> {
  return request.json().catch(() => INVALID_JSON);
}
