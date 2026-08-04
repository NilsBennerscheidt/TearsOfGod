import { writeFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { adminGuard } from "@/lib/admin/guards";
import { INVALID_JSON, readJson } from "@/lib/admin/read-json";
import { formatZodError } from "@/lib/content/format-zod-error";
import { getMedia, MEDIA_FILE } from "@/lib/content/media";
import { mediaFileSchema } from "@/lib/schemas/media";

export const runtime = "nodejs";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;

  const media = await getMedia();
  return NextResponse.json(media);
}

/**
 * Replaces the whole file rather than patching one entry — the admin UI
 * holds the full photos/videos array client-side (reorder, edit, delete
 * all operate on it in memory) and saves it back in one shot, the same
 * shape getMedia() reads. Still validated against the exact schema the
 * site reads with before anything touches disk, same invariant as the
 * posts/shows routes: this tool cannot produce a file that fails the
 * build.
 */
export async function PUT(request: NextRequest) {
  const guard = await adminGuard();
  if (guard) return guard;

  const raw = await readJson(request);
  if (raw === INVALID_JSON) {
    return NextResponse.json({ error: "Request body is not valid JSON." }, { status: 400 });
  }

  const parsed = mediaFileSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  await writeFile(MEDIA_FILE, `${JSON.stringify(parsed.data, null, 2)}\n`, "utf8");
  return NextResponse.json(parsed.data);
}
