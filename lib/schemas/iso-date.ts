import { z } from "zod";

/**
 * A version-agnostic ISO 8601 date/date-time check (Date.parse-based
 * rather than zod's `.datetime()`/`z.iso.datetime()` chain) so this
 * keeps working regardless of which zod-4.x point release is installed.
 */
export const isoDateTime = z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
  message: "must be a valid ISO 8601 date-time string",
});
