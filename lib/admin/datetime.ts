/**
 * Conversions between the admin's datetime picker and the ISO 8601
 * strings with an offset that show/post frontmatter stores
 * ("2026-10-31T18:45:00+01:00").
 *
 * The stored string is two facts glued together: a wall-clock time and
 * the UTC offset it's read in. The editor gets one control for each, so
 * these functions split and rejoin the string *textually* rather than
 * routing it through `new Date()`. That matters: converting through a
 * Date would re-express the instant in the browser's own zone, so a
 * Helsinki show stored as 18:45+03:00 would come back as 17:45 in the
 * picker — the right instant, but not the time on the door. What the
 * editor types is what the file says.
 */

const pad = (value: number) => String(value).padStart(2, "0");

/** What `<input type="datetime-local">` emits when it has a complete value; seconds only if the input asks for them. */
const LOCAL_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

/** ISO 8601 date-time, offset optional, seconds and fractions tolerated — hand-edited files aren't required to match what we write. */
const ISO_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?(?:\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

export interface IsoParts {
  /** Wall clock, in the shape `<input type="datetime-local">` wants: "2026-10-31T18:45". */
  local: string;
  /** UTC offset as ISO writes it: "+01:00". */
  offset: string;
}

/**
 * The UTC offset the browser's own zone is in at a given local wall-clock
 * time — the default a new date gets, and the reason a June show comes
 * out as +02:00 while a November one comes out as +01:00 without anyone
 * thinking about it.
 */
export function browserOffsetFor(localValue: string): string {
  const date = LOCAL_INPUT_PATTERN.test(localValue) ? new Date(localValue) : new Date();
  const reference = Number.isNaN(date.getTime()) ? new Date() : date;

  // getTimezoneOffset() is minutes *behind* UTC (Berlin in winter: -60),
  // the opposite sign of what ISO 8601 writes (+01:00).
  const offsetMinutes = -reference.getTimezoneOffset();
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absolute = Math.abs(offsetMinutes);
  return `${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}

/**
 * Splits a stored ISO string into the two things the editor controls.
 *
 * Returns null for anything unparseable, so a malformed date in a content
 * file renders as an empty picker to fix rather than a crash that hides
 * the form. A value written as "Z" is normalized to "+00:00" — the same
 * offset, in the form the `<select>` has an option for.
 *
 * A hand-edited value carrying *no* offset gets the browser's, because
 * that's already how the site reads it: `new Date("2026-05-02T18:45:00")`
 * resolves against the local zone. Defaulting to "+00:00" instead would
 * look tidier and quietly move the show by an hour or two the first time
 * someone re-saved it.
 */
export function parseIso(iso: string): IsoParts | null {
  const match = ISO_PATTERN.exec(iso.trim());
  if (!match) return null;

  const [, date, time, offset] = match;
  if (Number.isNaN(new Date(iso).getTime())) return null;

  const local = `${date}T${time}`;
  return {
    local,
    offset: offset === "Z" ? "+00:00" : (offset ?? browserOffsetFor(local)),
  };
}

/**
 * Glues the picker's wall clock back onto an offset. Returns "" for an
 * incomplete value, so a cleared field round-trips to an empty picker
 * instead of a phantom "Invalid Date". The shape is checked rather than
 * left to `new Date()`, which is lenient enough to turn a fragment like
 * "2026-1" into a real January date — a silently invented value is worse
 * than an empty one.
 */
export function joinIso(localValue: string, offset: string): string {
  if (!LOCAL_INPUT_PATTERN.test(localValue)) return "";
  const withSeconds = localValue.length === 16 ? `${localValue}:00` : localValue;
  return `${withSeconds}${offset}`;
}

/**
 * A stored timestamp as the admin lists it: the wall clock exactly as the
 * file has it, with the offset spelled out only when it differs from the
 * one the editor's own clock is in — so a Berlin show reads plainly and a
 * Helsinki show can't be misread as being an hour early.
 */
export function formatStored(iso: string): string {
  const parts = parseIso(iso);
  if (!parts) return iso;

  // parts.local is fixed-width "YYYY-MM-DDTHH:mm" by construction (parseIso
  // builds it from the matched groups), so slicing beats splitting twice.
  const day = parts.local.slice(8, 10);
  const month = parts.local.slice(5, 7);
  const year = parts.local.slice(0, 4);
  const time = parts.local.slice(11, 16);
  const readable = `${day}.${month}.${year}, ${time}`;

  return parts.offset === browserOffsetFor(parts.local) ? readable : `${readable} (UTC${parts.offset})`;
}
