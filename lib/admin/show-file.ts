import { writeFile } from "node:fs/promises";
import matter from "gray-matter";
import type { ShowFrontmatter } from "@/lib/schemas/show";

/**
 * Writes one content/shows/*.md file from validated frontmatter.
 *
 * Two things this does that a bare `matter.stringify()` wouldn't:
 *
 * 1. Prunes the fields Zod filled in with a default (`hidden: false`,
 *    `note: {}`) and empty note locales. They're semantically identical
 *    to absent, and leaving them in would mean every show the admin
 *    touches grows three lines of noise in `git diff` that say nothing.
 * 2. Writes an empty markdown body, always. A show's prose lives in
 *    `note` (per locale) — the body below the frontmatter is not read by
 *    anything, so keeping an editable copy of it would be a second,
 *    untranslated, invisible place for text to rot.
 */
export async function writeShowFile(filePath: string, frontmatter: ShowFrontmatter): Promise<void> {
  const note = Object.fromEntries(
    Object.entries(frontmatter.note).filter(([, value]) => typeof value === "string" && value.trim() !== ""),
  );

  const serializable: Record<string, unknown> = { ...frontmatter };
  if (!frontmatter.hidden) delete serializable.hidden;
  if (Object.keys(note).length === 0) delete serializable.note;
  else serializable.note = note;

  await writeFile(filePath, matter.stringify("", serializable), "utf8");
}
