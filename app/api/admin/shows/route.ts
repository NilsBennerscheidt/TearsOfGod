import { mkdir, readFile, writeFile } from "node:fs/promises";
import matter from "gray-matter";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/admin/guards";
import { resolveContentPath, SAFE_SLUG_PATTERN } from "@/lib/admin/paths";
import { formatZodError } from "@/lib/content/format-zod-error";
import { getShows, SHOWS_DIR } from "@/lib/content/shows";
import { showFrontmatterSchema } from "@/lib/schemas/show";

export const runtime = "nodejs";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;

  const shows = await getShows();
  return NextResponse.json({ items: shows });
}

// Shows have no locale split (see the schema's doc comment) and no
// separate `slug` frontmatter field — the filename *is* the slug, so
// creation takes it as a sibling field alongside `frontmatter` rather
// than folding it in.
const createSchema = z.object({
  slug: z.string().regex(SAFE_SLUG_PATTERN, "slug must be lowercase kebab-case"),
  frontmatter: showFrontmatterSchema,
  body: z.string().default(""),
});

export async function POST(request: NextRequest) {
  const guard = await adminGuard();
  if (guard) return guard;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const { slug, frontmatter, body } = parsed.data;

  let filePath: string;
  try {
    filePath = resolveContentPath(SHOWS_DIR, slug, ".md");
  } catch {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  const alreadyExists = await readFile(filePath, "utf8").then(
    () => true,
    () => false,
  );
  if (alreadyExists) {
    return NextResponse.json({ error: "A show with this slug already exists." }, { status: 409 });
  }

  await mkdir(SHOWS_DIR, { recursive: true });
  await writeFile(filePath, matter.stringify(body, frontmatter), "utf8");

  return NextResponse.json({ slug }, { status: 201 });
}
