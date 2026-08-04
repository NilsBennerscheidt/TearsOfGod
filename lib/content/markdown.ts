import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

export interface RawMarkdownFile {
  /** Filename without the .md extension. */
  id: string;
  data: Record<string, unknown>;
  content: string;
}

export async function listMarkdownIds(dir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  return entries.filter((name) => name.endsWith(".md")).map((name) => name.replace(/\.md$/, ""));
}

export async function readMarkdownFile(dir: string, id: string): Promise<RawMarkdownFile> {
  const filePath = path.join(dir, `${id}.md`);
  const raw = await readFile(filePath, "utf8");
  const { data, content } = matter(raw);
  return { id, data, content };
}

/**
 * Every caller (post bodies, legal pages, the admin preview) injects this
 * HTML below a page-level `<h1>` it renders itself (the post title, the
 * legal page's `page.title`) — a markdown body that starts with `# Foo`
 * would otherwise emit a second, competing `<h1>` on the same page,
 * which both breaks the page's single-h1 outline and confuses a screen
 * reader's heading navigation. Shifting every heading down one level
 * (h1→h2 … h5→h6, h6 stays h6 — there's no h7) makes that structurally
 * impossible regardless of what an author writes, rather than relying on
 * every content file remembering to start at `##` (the legal markdown
 * files already do, by convention, but a convention isn't a guarantee).
 * A plain regex is safe here — this HTML comes from this repo's own
 * markdown, not user input (see the `dangerouslySetInnerHTML` call sites
 * that consume it).
 */
function shiftHeadingsDown(html: string): string {
  return html.replace(/<(\/?)h([1-6])(?=[ >])/g, (_match, closing: string, level: string) => {
    const shifted = Math.min(6, Number(level) + 1);
    return `<${closing}h${shifted}`;
  });
}

export async function renderMarkdown(markdown: string): Promise<string> {
  if (!markdown.trim()) return "";
  const result = await remark().use(remarkHtml).process(markdown);
  return shiftHeadingsDown(result.toString());
}
