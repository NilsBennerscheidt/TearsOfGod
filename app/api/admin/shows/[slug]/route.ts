import { readFile, unlink, writeFile } from "node:fs/promises";
import matter from "gray-matter";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/admin/guards";
import { resolveContentPath } from "@/lib/admin/paths";
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

  const { data, content } = matter(raw);
  return NextResponse.json({ frontmatter: data, body: content });
}

const updateSchema = z.object({
  frontmatter: showFrontmatterSchema,
  body: z.string().default(""),
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

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  await writeFile(filePath, matter.stringify(parsed.data.body, parsed.data.frontmatter), "utf8");
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
