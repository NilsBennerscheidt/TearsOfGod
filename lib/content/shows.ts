import path from "node:path";
import { cache } from "react";
import { type AppLocale, routing } from "@/i18n/routing";
import { showFrontmatterSchema, type ShowFrontmatter } from "@/lib/schemas/show";
import type { Show } from "@/types/content";
import { formatZodError } from "@/lib/content/format-zod-error";
import { listMarkdownIds, readMarkdownFile, renderMarkdown } from "./markdown";

/** Exported for the local admin tool (app/api/admin/shows/**), which writes files here directly. */
export const SHOWS_DIR = path.join(process.cwd(), "content", "shows");

async function loadShows(): Promise<Show[]> {
  const ids = await listMarkdownIds(SHOWS_DIR);

  const shows = await Promise.all(
    ids.map(async (id) => {
      const { data } = await readMarkdownFile(SHOWS_DIR, id);
      const parsed = showFrontmatterSchema.safeParse(data);

      if (!parsed.success) {
        // Fail loudly at build/boot time — a malformed show must never
        // silently render as a broken or missing page.
        throw new Error(
          `Invalid frontmatter in content/shows/${id}.md:\n${formatZodError(parsed.error)}`,
        );
      }

      // The note is the only prose a show carries, and it's per locale —
      // the markdown *body* of a show file is unused (an earlier version
      // rendered it, but it had nowhere to be translated). Rendering all
      // locales here rather than at the call site keeps getAllShows()
      // locale-independent, so one cached read still serves both /de and
      // /en; an absent note renders to "" via renderMarkdown.
      const noteHtml = Object.fromEntries(
        await Promise.all(
          routing.locales.map(
            async (locale) => [locale, await renderMarkdown(parsed.data.note[locale] ?? "")] as const,
          ),
        ),
      ) as Record<AppLocale, string>;

      return { ...parsed.data, slug: id, noteHtml } satisfies Show;
    }),
  );

  return shows.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

/**
 * Whether a show may appear on the public site at all.
 *
 * `hidden` is the manual switch and wins outright; `hiddenUntil` is the
 * scheduled announcement. Precedence matters in exactly one case — a show
 * scheduled to announce last week and then pulled back by hand — and
 * "the human's explicit decision beats the older schedule" is the only
 * answer that doesn't re-publish something someone deliberately hid.
 *
 * Takes frontmatter rather than a full Show so the admin can call it on
 * an unsaved form value if it ever needs to.
 */
export function isShowPublished(show: ShowFrontmatter, now: Date = new Date()): boolean {
  if (show.hidden) return false;
  if (show.hiddenUntil && Date.parse(show.hiddenUntil) > now.getTime()) return false;
  return true;
}

/**
 * EVERY show on disk, hidden and scheduled ones included, sorted by date
 * ascending. This is the admin's view — public pages must go through
 * getPublishedShows()/getUpcomingShows() instead, which is why this one
 * is named for what it actually returns rather than the plainer
 * `getShows()` it used to be called.
 *
 * Wrapped in React's `cache()` so repeated calls within one
 * request/render dedupe to a single filesystem read, without persisting
 * across requests — a module-level cache would survive for the life of
 * the server process, so a new or edited show.md would need a restart to
 * show up. That's wrong for content meant to be editable.
 */
export const getAllShows = cache(async (): Promise<Show[]> => loadShows());

/** Shows the public site may render — past and future, but never hidden or not-yet-announced. */
export async function getPublishedShows(now: Date = new Date()): Promise<Show[]> {
  const shows = await getAllShows();
  return shows.filter((show) => isShowPublished(show, now));
}

export async function getUpcomingShows(now: Date = new Date()): Promise<Show[]> {
  const shows = await getPublishedShows(now);
  return shows.filter((show) => Date.parse(show.date) >= now.getTime());
}

/** The next show to happen, or null if none are upcoming. Landing page derives its "next show" from this — never hardcode it separately. */
export async function getNextShow(now: Date = new Date()): Promise<Show | null> {
  const upcoming = await getUpcomingShows(now);
  return upcoming[0] ?? null;
}

export async function getShowBySlug(slug: string): Promise<Show | null> {
  const shows = await getAllShows();
  return shows.find((show) => show.slug === slug) ?? null;
}
