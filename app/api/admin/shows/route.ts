import { mkdir, readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/admin/guards";
import { resolveContentPath, SAFE_SLUG_PATTERN } from "@/lib/admin/paths";
import { writeShowFile } from "@/lib/admin/show-file";
import { INVALID_JSON, readJson } from "@/lib/admin/read-json";
import { formatZodError } from "@/lib/content/format-zod-error";
import { getAllShows, SHOWS_DIR } from "@/lib/content/shows";
import { showFrontmatterSchema } from "@/lib/schemas/show";

export const runtime = "nodejs";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;

  // Deliberately unfiltered: the admin list is the one place that must
  // show hidden and not-yet-announced shows, since hiding one here is
  // exactly the thing it exists to let someone undo.
  const shows = await getAllShows();
  return NextResponse.json({ items: shows });
}

// Shows have no locale split (see the schema's doc comment) and no
// separate `slug` frontmatter field — the filename *is* the slug, so
// creation takes it as a sibling field alongside `frontmatter` rather
// than folding it in.
const createSchema = z.object({
  slug: z.string().regex(SAFE_SLUG_PATTERN, "slug must be lowercase kebab-case"),
  frontmatter: showFrontmatterSchema,
});

export async function POST(request: NextRequest) {
  const guard = await adminGuard();
  if (guard) return guard;

  const raw = await readJson(request);
  if (raw === INVALID_JSON) {
    return NextResponse.json({ error: "Request body is not valid JSON." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const { slug, frontmatter } = parsed.data;

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
  await writeShowFile(filePath, frontmatter);

  return NextResponse.json({ slug }, { status: 201 });
}
