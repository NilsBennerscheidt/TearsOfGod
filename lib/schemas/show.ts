import { z } from "zod";
import { isoDateTime } from "./iso-date";

export const showStatusSchema = z.enum(["available", "few-left", "sold-out"]);
export type ShowStatus = z.infer<typeof showStatusSchema>;

export const showPriceSchema = z.object({
  advance: z.number().nonnegative(),
  door: z.number().nonnegative(),
  currency: z.literal("EUR"),
});

/**
 * Show frontmatter — deliberately NOT mirrored per locale
 * (content/shows/*.md, not content/shows/de/*.md + content/shows/en/*.md).
 *
 * Every field here is structural/transactional, not prose: a date, a city,
 * a venue name, a ticket link. None of it changes meaning in translation
 * ("Castrop-Rauxel" is "Castrop-Rauxel" in English too). Duplicating these
 * fields across two locale files would recreate the exact drift problem
 * the original landing/tour page hardcoding had — two copies of the same
 * fact that can silently disagree. One file per show is the single source
 * of truth; only UI chrome around it (labels, status text) is translated,
 * via next-intl messages.
 *
 * If a show ever needs real per-locale prose (e.g. a translated note),
 * add it as an explicit `body: { de: string; en: string }` extension at
 * that point — don't split the whole file preemptively.
 */
export const showFrontmatterSchema = z.object({
  date: isoDateTime, // ISO 8601 with offset, e.g. "2026-06-19T20:00:00+02:00"
  city: z.string().min(1),
  venue: z.string().min(1),
  /** Optional bill/event title, for bookings that are themed multi-band nights rather than just "the band plays this venue" (e.g. "THIS IS HALLOWEEN 12.0"). Proper noun — not translated, same reasoning as city/venue above. */
  name: z.string().min(1).optional(),
  status: showStatusSchema,
  ticketUrl: z.string().url().optional(),
  price: showPriceSchema.optional(),
});

export type ShowFrontmatter = z.infer<typeof showFrontmatterSchema>;
