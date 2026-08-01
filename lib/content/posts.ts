import path from "node:path";
import { cache } from "react";
import type { AppLocale } from "@/i18n/routing";
import { postFrontmatterSchema } from "@/lib/schemas/post";
import type { Post } from "@/types/content";
import { formatZodError } from "./format-zod-error";
import { listMarkdownIds, readMarkdownFile, renderMarkdown } from "./markdown";

const POSTS_ROOT = path.join(process.cwd(), "content", "posts");

async function loadPosts(locale: AppLocale): Promise<Post[]> {
  const dir = path.join(POSTS_ROOT, locale);
  const ids = await listMarkdownIds(dir);

  const posts = await Promise.all(
    ids.map(async (id) => {
      const { data, content } = await readMarkdownFile(dir, id);
      const parsed = postFrontmatterSchema.safeParse(data);

      if (!parsed.success) {
        throw new Error(
          `Invalid frontmatter in content/posts/${locale}/${id}.md:\n${formatZodError(parsed.error)}`,
        );
      }

      const bodyHtml = await renderMarkdown(content);
      return { ...parsed.data, locale, bodyHtml } satisfies Post;
    }),
  );

  // Newest first — the blog-listing convention, opposite of getShows()'s
  // chronological (soonest-first) sort.
  return posts.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

/**
 * Posts for one locale. A post only appears here if that locale's file
 * exists — no cross-locale fallback. Wrapped in React's `cache()` — see
 * the comment on getShows() for why a module-level cache would be wrong
 * here.
 */
export const getPosts = cache(async (locale: AppLocale): Promise<Post[]> => loadPosts(locale));

export async function getPostBySlug(locale: AppLocale, slug: string): Promise<Post | null> {
  const posts = await getPosts(locale);
  return posts.find((post) => post.slug === slug) ?? null;
}
