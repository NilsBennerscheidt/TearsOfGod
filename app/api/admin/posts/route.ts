import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { adminGuard } from "@/lib/admin/guards";
import { resolveContentPath, SAFE_SLUG_PATTERN } from "@/lib/admin/paths";
import { INVALID_JSON, readJson } from "@/lib/admin/read-json";
import { formatZodError } from "@/lib/content/format-zod-error";
import { getPosts, POSTS_ROOT } from "@/lib/content/posts";
import { postFrontmatterSchema } from "@/lib/schemas/post";
import type { Post } from "@/types/content";

export const runtime = "nodejs";

/**
 * GET lists every post across both locales, grouped by slug — a post's
 * German and English files share a slug (see the schema's doc comment)
 * but are two independent files, so this is the view that lets the
 * admin UI flag "missing a translation" instead of just listing two
 * unrelated file lists.
 */
export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;

  const perLocale = await Promise.all(
    routing.locales.map(async (locale) => ({ locale, posts: await getPosts(locale) })),
  );

  const slugs = Array.from(new Set(perLocale.flatMap(({ posts }) => posts.map((post) => post.slug))));

  const items = slugs.map((slug) => {
    const translations: Record<string, Post> = {};
    for (const { locale, posts } of perLocale) {
      const post = posts.find((p) => p.slug === slug);
      if (post) translations[locale] = post;
    }
    const missingLocales = routing.locales.filter((locale) => !translations[locale]);
    return { slug, translations, missingLocales };
  });

  return NextResponse.json({ items });
}

// slug isn't a frontmatter field (see postFrontmatterSchema's doc comment)
// — the filename *is* the slug, so creation takes it as a sibling field
// alongside `frontmatter`, same shape the shows route already uses.
const createSchema = z.object({
  locale: z.enum(routing.locales),
  slug: z.string().regex(SAFE_SLUG_PATTERN, "slug must be lowercase kebab-case"),
  frontmatter: postFrontmatterSchema,
  body: z.string(),
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

  const { locale, slug, frontmatter, body } = parsed.data;
  const dir = path.join(POSTS_ROOT, locale);

  let filePath: string;
  try {
    filePath = resolveContentPath(dir, slug, ".md");
  } catch {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  const alreadyExists = await readFile(filePath, "utf8").then(
    () => true,
    () => false,
  );
  if (alreadyExists) {
    return NextResponse.json({ error: "A post with this slug already exists for this locale." }, { status: 409 });
  }

  await mkdir(dir, { recursive: true });
  await writeFile(filePath, matter.stringify(body, frontmatter), "utf8");

  return NextResponse.json({ locale, slug }, { status: 201 });
}
