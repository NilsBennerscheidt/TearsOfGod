import { z } from "zod";

/**
 * Media library — photos and videos for the /media page. JSON, not a
 * hand-written .ts module: this file is meant to be machine-written (by
 * the local admin tool, see content/media.json), and a data file an
 * editor can safely overwrite is worth more here than one an author can
 * comment. Read through getMedia() (lib/content/media.ts), which parses
 * it against this schema the same way posts/shows are parsed against
 * theirs — a malformed entry fails the build loudly instead of rendering
 * a broken tile.
 */
export const mediaPhotoSchema = z.object({
  id: z.string().min(1),
  /** Path under public/media/photos/, e.g. "/media/photos/live-01.jpg". */
  src: z.string().regex(/^\/media\/photos\//, "src must be under /media/photos/"),
  /** Required — next/image needs it, and it's the a11y label besides. */
  alt: z.string().min(1),
  /** Intrinsic pixel dimensions, required by next/image for local files without a loader. */
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  credit: z.string().min(1).optional(),
});

export const mediaVideoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** Path under public/media/videos/, e.g. "/media/videos/live-01.mp4". */
  src: z.string().regex(/^\/media\/videos\//, "src must be under /media/videos/"),
  /** Poster frame, path under public/media/videos/. */
  poster: z.string().regex(/^\/media\/videos\//, "poster must be under /media/videos/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const mediaFileSchema = z.object({
  photos: z.array(mediaPhotoSchema).default([]),
  videos: z.array(mediaVideoSchema).default([]),
});

export type MediaPhoto = z.infer<typeof mediaPhotoSchema>;
export type MediaVideo = z.infer<typeof mediaVideoSchema>;
