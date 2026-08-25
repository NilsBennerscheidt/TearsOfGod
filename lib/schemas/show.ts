import { z } from "zod";
import type { AppLocale } from "@/i18n/routing";
import { HOME_COUNTRY } from "@/lib/countries";
import { isoDateTime } from "./iso-date";

export const showStatusSchema = z.enum(["available", "few-left", "sold-out"]);
export type ShowStatus = z.infer<typeof showStatusSchema>;

export const showPriceSchema = z.object({
  advance: z.number().nonnegative(),
  door: z.number().nonnegative(),
  currency: z.literal("EUR"),
});

/**
 * ISO 3166-1 alpha-2, e.g. "DE", "CZ". A regex rather than an enum of the
 * admin's dropdown list (lib/countries.ts) on purpose: the dropdown is a
 * convenience for the common cases, and a booking in a country nobody
 * anticipated should be a hand-edit of one markdown file, not a code
 * change that blocks the content until someone ships it.
 */
export const countryCodeSchema = z
  .string()
  .regex(/^[A-Z]{2}$/, "must be an ISO 3166-1 alpha-2 country code, e.g. DE or CZ");

/**
 * The one genuinely translated part of a show: a short free-text note
 * ("our first show outside of Germany…"), authored as Markdown per
 * locale. This is the `body: { de, en }` extension the schema comment
 * below anticipated — it lives in frontmatter rather than splitting shows
 * into content/shows/de/*.md + content/shows/en/*.md, so the structural
 * facts (date, venue, ticket URL) still have exactly one copy and can't
 * drift between languages.
 *
 * Every locale is optional and there is NO cross-locale fallback (same
 * rule posts follow): a show with only a German note simply shows no note
 * in English, rather than silently serving German prose to an English
 * reader.
 */
export const showNoteSchema = z.object({
  de: z.string().min(1).optional(),
  en: z.string().min(1).optional(),
});
export type ShowNote = z.infer<typeof showNoteSchema>;

// Compile-time guard: adding a locale to routing.locales without adding a
// field above is a type error here, not a note that silently never renders.
type AssertNoteCoversEveryLocale = AppLocale extends keyof ShowNote ? true : never;
const _noteCoversEveryLocale: AssertNoteCoversEveryLocale = true;
void _noteCoversEveryLocale;

/**
 * Show frontmatter — deliberately NOT mirrored per locale
 * (content/shows/*.md, not content/shows/de/*.md + content/shows/en/*.md).
 *
 * Everything here except `note` is structural/transactional, not prose: a
 * date, a city, a venue name, a ticket link. None of it changes meaning in
 * translation ("Castrop-Rauxel" is "Castrop-Rauxel" in English too).
 * Duplicating these fields across two locale files would recreate the
 * exact drift problem the original landing/tour page hardcoding had — two
 * copies of the same fact that can silently disagree. One file per show is
 * the single source of truth; UI chrome around it (labels, status text) is
 * translated via next-intl messages, and the only real prose a show
 * carries is `note`, which is translated in place (see showNoteSchema).
 */
export const showFrontmatterSchema = z.object({
  date: isoDateTime, // ISO 8601 with offset, e.g. "2026-06-19T20:00:00+02:00"
  city: z.string().min(1),
  /**
   * Defaulted rather than required, because every show file written
   * before this field existed is a German show — an unmarked file means
   * "at home", which is both the historical truth and the common case.
   */
  country: countryCodeSchema.default(HOME_COUNTRY),
  venue: z.string().min(1),
  /** Optional bill/event title, for bookings that are themed multi-band nights rather than just "the band plays this venue" (e.g. "THIS IS HALLOWEEN 12.0"). Proper noun — not translated, same reasoning as city/venue above. */
  name: z.string().min(1).optional(),
  status: showStatusSchema,
  ticketUrl: z.string().url().optional(),
  price: showPriceSchema.optional(),
  /**
   * Hard "not on the site" switch — a booking that's confirmed internally
   * but not announced yet, or one pulled back after being announced.
   * Overrides `hiddenUntil`: an explicit hide by a human always wins over
   * a schedule set earlier (see isShowPublished in lib/content/shows.ts).
   */
  hidden: z.boolean().default(false),
  /**
   * Announce automatically at this instant — the show stays off the
   * public site until then, and needs no second visit to the admin to go
   * live. /tour and the landing page revalidate hourly, so the real
   * publish moment is "within the hour after this timestamp", which is
   * the same granularity those pages already have for dropping past shows.
   */
  hiddenUntil: isoDateTime.optional(),
  /** Translated free-text note, Markdown per locale — see showNoteSchema. */
  note: showNoteSchema.default({}),
});

export type ShowFrontmatter = z.infer<typeof showFrontmatterSchema>;
