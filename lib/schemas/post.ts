import { z } from "zod";
import { isoDateTime } from "./iso-date";
import { mediaPhotoSchema } from "./media";

/**
 * A self-hosted clip or a link out to a release, not an iframe embed —
 * same call VideoGrid already makes (see its doc comment): a Spotify
 * player loads third-party trackers on render, which would make the
 * current Datenschutz page's text inaccurate and require a consent gate.
 * `kind` discriminates so the two shapes can't be confused with each
 * other at the type level.
 */
export const postEmbedSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("video"),
    src: z.string().regex(/^\/media\/videos\//, "src must be under /media/videos/"),
    poster: z.string().regex(/^\/media\/videos\//, "poster must be under /media/videos/"),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    title: z.string().min(1),
  }),
  z.object({
    kind: z.literal("spotify"),
    url: z.string().url(),
  }),
]);

/**
 * Post frontmatter — mirrored per locale
 * (content/posts/de/*.md and content/posts/en/*.md), unlike shows.
 *
 * Posts are editorial prose: title, excerpt, and body are the actual
 * content, not metadata around a fact. Translating a post is real
 * authorial work, not a lookup — so each locale gets its own file.
 * `slug` is the link between a post's translations: a German and an
 * English file sharing the same `slug` are treated as the same post in
 * different languages. A post missing a translation in one locale is
 * simply absent from that locale's listing rather than falling back to
 * the other language silently.
 */
export const postFrontmatterSchema = z.object({
  title: z.string().min(1),
  date: isoDateTime,
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case"),
  excerpt: z.string().min(1),
  tags: z.array(z.string()).default([]),
  /** Hero image, shown above the title on the detail page and as the listing thumbnail. Reuses the media-library photo shape rather than redeclaring it. */
  cover: mediaPhotoSchema.optional(),
  /** Additional photos shown at the end of the post body, rendered through the same PhotoGrid/lightbox as the /media page. */
  gallery: z.array(mediaPhotoSchema).default([]),
  embed: postEmbedSchema.optional(),
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;
export type PostEmbed = z.infer<typeof postEmbedSchema>;
