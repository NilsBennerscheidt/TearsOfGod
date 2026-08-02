import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { adminGuard } from "@/lib/admin/guards";
import { readImageSize } from "@/lib/admin/image-size";
import { resolveContentPath } from "@/lib/admin/paths";

export const runtime = "nodejs";

const MEDIA_PUBLIC_ROOT = path.join(process.cwd(), "public", "media");

// Not `Record<string, string[]>` — an index signature would put
// `undefined` back into every `KIND_EXTENSIONS[kind]` lookup below
// (noUncheckedIndexedAccess), even after the `isMediaKind` guard has
// narrowed `kind` to the literal "photos" | "videos" union. Plain
// literal keys let that narrowing carry through.
const KIND_EXTENSIONS = {
  photos: [".jpg", ".jpeg", ".png"],
  videos: [".mp4", ".webm"],
} satisfies Record<"photos" | "videos", string[]>;

type MediaKind = keyof typeof KIND_EXTENSIONS;

function isMediaKind(value: unknown): value is MediaKind {
  return typeof value === "string" && value in KIND_EXTENSIONS;
}

function sanitizeBaseName(name: string): string {
  const withoutExtension = name.replace(/\.[^./]+$/, "");
  const slug = withoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "upload";
}

/**
 * Multipart upload → public/media/{photos|videos}/. Dimensions for
 * photos come from readImageSize (lib/admin/image-size.ts) — read from
 * the uploaded bytes themselves, not trusted from the client, so the
 * media.json entry the admin UI builds from this response can't disagree
 * with the actual file.
 */
export async function POST(request: NextRequest) {
  const guard = await adminGuard();
  if (guard) return guard;

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File) || !isMediaKind(kind)) {
    return NextResponse.json({ error: 'Expected a "file" and a "kind" of "photos" or "videos".' }, { status: 400 });
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!KIND_EXTENSIONS[kind].includes(extension)) {
    return NextResponse.json(
      { error: `${kind} must be one of: ${KIND_EXTENSIONS[kind].join(", ")}` },
      { status: 400 },
    );
  }

  const baseName = sanitizeBaseName(file.name);
  const dir = path.join(MEDIA_PUBLIC_ROOT, kind);

  let filePath: string;
  try {
    filePath = resolveContentPath(dir, baseName, extension);
  } catch {
    return NextResponse.json({ error: "Invalid filename." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, buffer);

  const src = `/media/${kind}/${baseName}${extension}`;

  if (kind === "photos") {
    const { width, height } = readImageSize(buffer);
    return NextResponse.json({ src, width, height }, { status: 201 });
  }

  return NextResponse.json({ src }, { status: 201 });
}
