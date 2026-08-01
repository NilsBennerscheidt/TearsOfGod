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

export async function renderMarkdown(markdown: string): Promise<string> {
  if (!markdown.trim()) return "";
  const result = await remark().use(remarkHtml).process(markdown);
  return result.toString();
}
