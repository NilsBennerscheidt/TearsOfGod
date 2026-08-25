import type { AppLocale } from "@/i18n/routing";

/**
 * The band's home country. Shows here render as just a city ("Waltrop");
 * everywhere else gets the country spelled out next to it, since "Prague"
 * alone doesn't tell a reader in the Ruhrgebiet whether that's a bus ride
 * or a border crossing. Not a validation rule — only a display default.
 */
export const HOME_COUNTRY = "DE";

/**
 * The admin's country dropdown, NOT a validation whitelist:
 * showFrontmatterSchema accepts any well-formed ISO 3166-1 alpha-2 code,
 * so a one-off show somewhere not listed here is a hand-edit of the
 * markdown file away rather than a code change. Kept to the countries a
 * German hardcore band plausibly plays, because a 250-entry <select> is
 * worse at the one job it has (picking DE, NL, or CZ quickly).
 */
export const COUNTRY_CODES = [
  "DE", "AT", "CH", "NL", "BE", "LU", "FR", "GB", "IE", "DK",
  "SE", "NO", "FI", "IS", "PL", "CZ", "SK", "HU", "SI", "HR",
  "IT", "ES", "PT", "EE", "LV", "LT", "RO", "BG", "GR", "RS",
  "BA", "UA", "US", "CA",
] as const;

/**
 * One Intl.DisplayNames instance per locale rather than one per call —
 * ShowTable resolves a name for every row it renders, and constructing
 * the formatter is the expensive half of that.
 */
const displayNamesByLocale = new Map<string, Intl.DisplayNames>();

/**
 * Localized country name for an alpha-2 code ("CZ" → "Tschechien" / "Czechia").
 * These come from the runtime's CLDR data, not from messages/*.json: a
 * country list is exactly the kind of thing that would rot if it were
 * hand-maintained in two catalogues.
 *
 * Falls back to the raw code rather than throwing — a malformed code in a
 * content file should degrade to "CZ" on the page, not take out the
 * whole /tour route.
 */
export function countryName(code: string, locale: AppLocale | string): string {
  try {
    let displayNames = displayNamesByLocale.get(locale);
    if (!displayNames) {
      displayNames = new Intl.DisplayNames([locale], { type: "region" });
      displayNamesByLocale.set(locale, displayNames);
    }
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}
