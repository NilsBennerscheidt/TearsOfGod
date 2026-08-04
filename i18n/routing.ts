import { hasLocale } from "next-intl";
import { defineRouting } from "next-intl/routing";
import { notFound } from "next/navigation";

// German-first band, but every route carries an explicit locale prefix
// (/de/..., /en/...) rather than hiding the default locale — this keeps
// canonical URLs, JSON-LD, and static generation unambiguous.
export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

/**
 * Narrows a route's raw `params.locale` (always `string` — Next doesn't
 * know it's constrained to routing.locales) to `AppLocale`, calling
 * notFound() on anything else instead of `locale as AppLocale`. The cast
 * is sound today only because app/[locale]/layout.tsx already validates
 * with `hasLocale` before any child page renders — but that validation
 * lives in a different file than the cast, so nothing stops a future
 * route rendered outside that layout (or a refactor that reorders the
 * check) from shipping an unvalidated value under an assertion that
 * claims otherwise. This makes the narrowing self-contained wherever
 * it's used.
 */
export function parseLocale(locale: string): AppLocale {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  return locale;
}
