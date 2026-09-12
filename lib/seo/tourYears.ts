import type { Show } from "@/types/content";

/**
 * The year span the upcoming shows cover, as a display string — "2026",
 * or "2026–2027" when a run crosses a year boundary.
 *
 * Exists so /tour's heading and title tag can say "Live-Termine 2026"
 * without freezing 2026 into the message catalogue, where it would
 * quietly become a lie the moment the last 2026 show passes. Derived from
 * the same getUpcomingShows() the page already renders, so the heading
 * cannot disagree with the table underneath it.
 *
 * Falls back to the current year when nothing is announced, which is what
 * the page's own "no shows announced" state is talking about.
 */
export function tourYears(shows: Show[], now: Date = new Date()): string {
  const years = shows.map((show) => new Date(show.date).getFullYear());
  if (years.length === 0) return String(now.getFullYear());

  const first = Math.min(...years);
  const last = Math.max(...years);
  return first === last ? String(first) : `${first}–${last}`;
}
