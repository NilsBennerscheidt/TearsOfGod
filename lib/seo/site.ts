/**
 * The one canonical origin for the site.
 *
 * www, not the bare domain: tearsofgod.net/… 301s to www.tearsofgod.net/…
 * at the host level, so every absolute URL we publish ourselves —
 * canonicals, hreflang alternates, og:url, og:image, the sitemap, the
 * robots.txt sitemap pointer — has to name the host the redirect lands on.
 * Pointing a canonical at a URL that immediately redirects makes a search
 * engine resolve the hop before it can trust the tag, and splits the same
 * page across two hosts in the meantime.
 *
 * Overridable via NEXT_PUBLIC_SITE_URL so a preview deployment can
 * declare its own origin instead of claiming to be production. Any
 * trailing slash is stripped, because every caller appends a path that
 * already starts with one.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tearsofgod.net").replace(/\/+$/, "");

/** Absolute URL for a root-relative path (`/de/tour` → `https://www.tearsofgod.net/de/tour`). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
