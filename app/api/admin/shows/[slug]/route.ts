import { readFile, unlink } from "node:fs/promises";
import matter from "gray-matter";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/admin/guards";
import { resolveContentPath } from "@/lib/admin/paths";
import { writeShowFile } from "@/lib/admin/show-file";
import { INVALID_JSON, readJson } from "@/lib/admin/read-json";
import { formatZodError } from "@/lib/content/format-zod-error";
import { SHOWS_DIR } from "@/lib/content/shows";
import { showFrontmatterSchema } from "@/lib/schemas/show";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await adminGuard();
  if (guard) return guard;

  const { slug } = await params;

  let filePath: string;
  try {
    filePath = resolveContentPath(SHOWS_DIR, slug, ".md");
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const raw = await readFile(filePath, "utf8").catch(() => null);
  if (raw === null) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Frontmatter only — a show's markdown body is unused (its prose lives
  // in the per-locale `note` field), so handing one to the editor would
  // invite writing text that never renders.
  const { data } = matter(raw);
  return NextResponse.json({ frontmatter: data });
}

const updateSchema = z.object({
  frontmatter: showFrontmatterSchema,
});

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const guard = await adminGuard();
  if (guard) return guard;

  const { slug } = await params;

  let filePath: string;
  try {
    filePath = resolveContentPath(SHOWS_DIR, slug, ".md");
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

  await writeShowFile(filePath, parsed.data.frontmatter);
  return NextResponse.json({ slug });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const guard = await adminGuard();
  if (guard) return guard;

  const { slug } = await params;

  let filePath: string;
  try {
    filePath = resolveContentPath(SHOWS_DIR, slug, ".md");
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await unlink(filePath).catch(() => {});
  return NextResponse.json({ ok: true });
}
