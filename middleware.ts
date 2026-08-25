import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing, type AppLocale } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/** The cookie next-intl writes when a visitor switches language. */
const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Picks a locale from an Accept-Language header, German-or-English.
 *
 * Deliberately *not* next-intl's own negotiation, which we'd otherwise
 * get for free: its unmatched case falls back to `routing.defaultLocale`,
 * which is "de" (a German band), so a French or Japanese browser would
 * land on the German site. English is the better second guess for
 * "neither of our two languages", so only an actual German preference
 * routes to /de. Changing routing.defaultLocale instead would have been
 * the wrong lever — it also decides the not-found fallback locale and
 * the canonical/hreflang defaults, which should stay German.
 *
 * Quality values are honoured, so `de;q=0.3, fr;q=0.9, en;q=0.8` picks
 * en, not de: the first *listed* German tag is not necessarily the
 * preferred one. Ties keep header order (Array#sort is stable).
 */
function localeFromHeader(header: string | null): AppLocale {
  if (!header) return "en";

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const quality = q ? Number.parseFloat(q.slice(2)) : 1;
      return {
        tag: tag.trim().toLowerCase(),
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    // q=0 is an explicit "not this one", not a weak preference.
    .filter((entry) => entry.tag !== "" && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    // Match on the primary subtag so every German regional variant
    // (de-AT, de-CH, de-DE) counts, not just a bare "de".
    const [base] = tag.split("-");
    if (base === "de") return "de";
    if (base === "en") return "en";
  }
  return "en";
}

function detectLocale(request: NextRequest): AppLocale {
  // An explicit choice via the language switcher outranks the browser's
  // setting — someone reading the English site on a German laptop should
  // not be bounced back to /de by every unprefixed link they follow.
  const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
  if (chosen && hasLocale(routing.locales, chosen)) return chosen;

  return localeFromHeader(request.headers.get("accept-language"));
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocalePrefix = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (!hasLocalePrefix) {
    // `/`, `/tour`, `/news/some-slug` — send it to the same path under a
    // negotiated locale. Cloning the URL keeps the query string and hash.
    const url = request.nextUrl.clone();
    url.pathname = `/${detectLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  // Skip API routes, Next internals, Vercel internals, the local-only
  // admin tool (its own root layout outside [locale] — see
  // app/admin/layout.tsx — would otherwise get redirected to /de/admin
  // by next-intl), and any request for a file with an extension (assets,
  // favicon, etc.). Each excluded segment is anchored with `(?:/|$)` —
  // a bare alternation like `api|admin` excludes anything that *starts
  // with* those letters (a future `/api-reference` or `/administration`
  // route would silently skip i18n too), not just the segment itself.
  matcher: ["/((?!(?:api|trpc|_next|_vercel|admin)(?:/|$)|.*\\..*).*)"],
};
