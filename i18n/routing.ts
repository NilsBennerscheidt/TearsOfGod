import { defineRouting } from "next-intl/routing";

// German-first band, but every route carries an explicit locale prefix
// (/de/..., /en/...) rather than hiding the default locale — this keeps
// canonical URLs, JSON-LD, and static generation unambiguous.
export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
