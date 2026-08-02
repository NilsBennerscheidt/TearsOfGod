import type { MediaPhoto as MediaPhotoBase, MediaVideo as MediaVideoBase } from "@/lib/schemas/media";
import type { PostFrontmatter } from "@/lib/schemas/post";
import type { ShowFrontmatter } from "@/lib/schemas/show";

export interface Show extends ShowFrontmatter {
  /** Derived from the filename, e.g. "2026-06-19-werkstatt-44". */
  slug: string;
  /** Rendered HTML; empty string when the markdown body is empty. */
  bodyHtml: string;
}

export interface Post extends PostFrontmatter {
  /** Which locale's file this came from — the folder segment, not frontmatter. */
  locale: string;
  bodyHtml: string;
}

export type MediaPhoto = MediaPhotoBase;
export type MediaVideo = MediaVideoBase;
