import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { adminGuard } from "@/lib/admin/guards";
import { resolveContentPath, UnsafePathError } from "@/lib/admin/paths";
import { INVALID_JSON, readJson } from "@/lib/admin/read-json";
import { formatZodError } from "@/lib/content/format-zod-error";
import { POSTS_ROOT } from "@/lib/content/posts";
import { postFrontmatterSchema } from "@/lib/schemas/post";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ locale: string; slug: string }> };

/**
 * `locale` is checked against the fixed routing.locales set — an
 * allowlist, not a regex — before it ever reaches path.join, so it can
 * only ever be "de" or "en" here regardless of what the URL contains.
 * `slug` still goes through resolveContentPath's own regex + containment
 * check (lib/admin/paths.ts), since it isn't drawn from a fixed set.
 */
function resolvePostPath(locale: string, slug: string): string {
  if (!(routing.locales as readonly string[]).includes(locale)) {
    throw new UnsafePathError(`Unknown locale "${locale}"`);
  }
  return resolveContentPath(path.join(POSTS_ROOT, locale), slug, ".md");
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await adminGuard();
  if (guard) return guard;

  const { locale, slug } = await params;

  let filePath: string;
  try {
    filePath = resolvePostPath(locale, slug);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const raw = await readFile(filePath, "utf8").catch(() => null);
  if (raw === null) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, content } = matter(raw);
  return NextResponse.json({ frontmatter: data, body: content });
}

const updateSchema = z.object({
  frontmatter: postFrontmatterSchema,
  body: z.string(),
});

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const guard = await adminGuard();
  if (guard) return guard;

  const { locale, slug } = await params;

  let filePath: string;
  try {
    filePath = resolvePostPath(locale, slug);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const raw = await readJson(request);
  if (raw === INVALID_JSON) {
    return NextResponse.json({ error: "Request body is not valid JSON." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  // slug isn't a frontmatter field (see postFrontmatterSchema's doc
  // comment) — it's fixed by the URL/filename, so there's nothing to
  // compare against a submitted value here. Renaming would mean moving a
  // file, not editing one — kept out of scope for this pass; delete +
  // recreate under the new slug instead.
  await writeFile(filePath, matter.stringify(parsed.data.body, parsed.data.frontmatter), "utf8");
  return NextResponse.json({ locale, slug });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const guard = await adminGuard();
  if (guard) return guard;

  const { locale, slug } = await params;

  let filePath: string;
  try {
    filePath = resolvePostPath(locale, slug);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await unlink(filePath).catch(() => {});
  return NextResponse.json({ ok: true });
}
