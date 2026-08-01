import path from "node:path";
import { cache } from "react";
import { band } from "@/content/band";
import type { AppLocale } from "@/i18n/routing";
import { readMarkdownFile, renderMarkdown } from "./markdown";

const LEGAL_DIR = path.join(process.cwd(), "content", "legal");

/**
 * Facts that must never drift between the app and the legal pages. The
 * contact address previously lived hardcoded in all four markdown files
 * and silently went stale the moment `band.contactEmail` changed —
 * exactly the duplication problem these tokens remove. An Impressum
 * listing an unreachable address is a legal defect, not a typo.
 */
const TOKENS: Record<string, string> = {
  "{{contactEmail}}": band.contactEmail,
};

function substitute(markdown: string): string {
  return Object.entries(TOKENS).reduce((acc, [token, value]) => acc.split(token).join(value), markdown);
}

export type LegalSlug = "impressum" | "datenschutz";

export interface LegalPage {
  title: string;
  bodyHtml: string;
}

/**
 * Unlike shows/posts, this isn't a growing collection — it's exactly 2
 * pages × 2 locales, always at fixed routes. No Zod schema (just a
 * `title` frontmatter field) and no listing/lookup-by-slug machinery to
 * match; a thin dedicated loader is simpler than reusing the generic
 * collection pattern for 4 known files.
 */
export const getLegalPage = cache(async (slug: LegalSlug, locale: AppLocale): Promise<LegalPage> => {
  const { data, content } = await readMarkdownFile(LEGAL_DIR, `${slug}.${locale}`);
  const bodyHtml = await renderMarkdown(substitute(content));
  return { title: String(data.title ?? slug), bodyHtml };
});
