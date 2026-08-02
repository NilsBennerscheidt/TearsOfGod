import path from "node:path";

/** Lowercase kebab-case only — same shape as post/show slugs already require (lib/schemas/post.ts, and show filenames like "2026-10-31-viersen-halloween-12"). */
export const SAFE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class UnsafePathError extends Error {}

/**
 * Turns a user-supplied id (a post/show slug from a request body or URL
 * param) into a real filesystem path, for admin routes that write inside
 * content/. Two independent checks, not one:
 *
 * 1. The id must match SAFE_SLUG_PATTERN — this alone should already
 *    make traversal (`../../etc`) or absolute-path injection impossible.
 * 2. The resolved path must still be inside `root` — belt-and-suspenders:
 *    a single missed edge case in a regex is a much smaller blast radius
 *    than a single missed edge case in "can this write outside content/".
 *
 * Throws UnsafePathError (never returns a path outside `root`) rather
 * than sanitizing/truncating the id — a rejected write is recoverable,
 * a silent write to the wrong file is not.
 */
export function resolveContentPath(root: string, id: string, extension: string): string {
  if (!SAFE_SLUG_PATTERN.test(id)) {
    throw new UnsafePathError(`"${id}" is not a safe filename segment`);
  }

  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, `${id}${extension}`);

  if (!resolved.startsWith(resolvedRoot + path.sep)) {
    throw new UnsafePathError(`"${id}" resolves outside of ${root}`);
  }

  return resolved;
}
