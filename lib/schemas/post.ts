import { z } from "zod";
import { isoDateTime } from "./iso-date";

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
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;
