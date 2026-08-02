import path from "node:path";
import { cache } from "react";
import { showFrontmatterSchema } from "@/lib/schemas/show";
import type { Show } from "@/types/content";
import { formatZodError } from "@/lib/content/format-zod-error";
import { listMarkdownIds, readMarkdownFile, renderMarkdown } from "./markdown";

/** Exported for the local admin tool (app/api/admin/shows/**), which writes files here directly. */
export const SHOWS_DIR = path.join(process.cwd(), "content", "shows");

async function loadShows(): Promise<Show[]> {
  const ids = await listMarkdownIds(SHOWS_DIR);

  const shows = await Promise.all(
    ids.map(async (id) => {
      const { data, content } = await readMarkdownFile(SHOWS_DIR, id);
      const parsed = showFrontmatterSchema.safeParse(data);

      if (!parsed.success) {
        // Fail loudly at build/boot time — a malformed show must never
        // silently render as a broken or missing page.
        throw new Error(
          `Invalid frontmatter in content/shows/${id}.md:\n${formatZodError(parsed.error)}`,
        );
      }

      const bodyHtml = await renderMarkdown(content);
      return { ...parsed.data, slug: id, bodyHtml } satisfies Show;
    }),
  );

  return shows.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

/**
 * All shows, past and future, sorted by date ascending.
 *
 * Wrapped in React's `cache()` so repeated calls within one request/render
 * dedupe to a single filesystem read, without persisting across requests —
 * a module-level cache would survive for the life of the server process,
 * so a new or edited show.md would need a restart to show up. That's
 * wrong for content meant to be editable.
 */
export const getShows = cache(async (): Promise<Show[]> => loadShows());

export async function getUpcomingShows(now: Date = new Date()): Promise<Show[]> {
  const shows = await getShows();
  return shows.filter((show) => Date.parse(show.date) >= now.getTime());
}

/** The next show to happen, or null if none are upcoming. Landing page derives its "next show" from this — never hardcode it separately. */
export async function getNextShow(now: Date = new Date()): Promise<Show | null> {
  const upcoming = await getUpcomingShows(now);
  return upcoming[0] ?? null;
}

export async function getShowBySlug(slug: string): Promise<Show | null> {
  const shows = await getShows();
  return shows.find((show) => show.slug === slug) ?? null;
}
