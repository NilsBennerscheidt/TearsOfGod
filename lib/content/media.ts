import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { mediaFileSchema } from "@/lib/schemas/media";
import type { MediaPhoto, MediaVideo } from "@/types/content";
import { formatZodError } from "./format-zod-error";

/** Exported for the local admin tool (app/api/admin/media/route.ts), which writes this file directly. */
export const MEDIA_FILE = path.join(process.cwd(), "content", "media.json");

async function loadMedia(): Promise<{ photos: MediaPhoto[]; videos: MediaVideo[] }> {
  const raw = await readFile(MEDIA_FILE, "utf8");
  const parsed = mediaFileSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    throw new Error(`Invalid content/media.json:\n${formatZodError(parsed.error)}`);
  }

  return parsed.data;
}

/**
 * Photos + videos for the /media page. Wrapped in React's `cache()` — see
 * the comment on getShows() for why a module-level cache would be wrong
 * here (edits made through the local admin tool must show up without a
 * server restart).
 */
export const getMedia = cache(async (): Promise<{ photos: MediaPhoto[]; videos: MediaVideo[] }> => loadMedia());
