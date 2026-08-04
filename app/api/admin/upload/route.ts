import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { adminGuard } from "@/lib/admin/guards";
import { readImageSize } from "@/lib/admin/image-size";
import { resolveContentPath } from "@/lib/admin/paths";

export const runtime = "nodejs";

const MEDIA_PUBLIC_ROOT = path.join(process.cwd(), "public", "media");

/**
 * `multipart/form-data` is a CORS-"simple" content type — a cross-origin
 * POST with this body triggers no preflight, so unlike the JSON admin
 * routes (where the browser refuses to even send a cross-origin
 * `application/json` request without one), adminGuard()'s Host check is
 * the *only* thing standing between this route and a form on any site
 * the admin happens to have open in another tab while `next dev` runs.
 * A same-origin request from the admin UI itself always carries an
 * `Origin` header matching its own `Host` (Chromium/Firefox both send
 * `Origin` on POST regardless of same-origin), so rejecting a mismatch
 * costs the real client nothing.
 */
function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // no Origin header at all — not a browser cross-origin form post
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB — generous for a JPEG/PNG/short MP4, small enough to bound memory use

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

async function pathExists(filePath: string): Promise<boolean> {
  return stat(filePath).then(
    () => true,
    () => false,
  );
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

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large (max 50 MB)." }, { status: 413 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File) || !isMediaKind(kind)) {
    return NextResponse.json({ error: 'Expected a "file" and a "kind" of "photos" or "videos".' }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large (max 50 MB)." }, { status: 413 });
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

  if (await pathExists(filePath)) {
    return NextResponse.json({ error: `${baseName}${extension} already exists.` }, { status: 409 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Read (and validate) dimensions before anything touches disk — a
  // buffer that isn't actually a readable PNG/JPEG (wrong bytes behind a
  // ".jpg" name) must not leave a written-but-unreferenced file behind.
  let photoSize: { width: number; height: number } | null = null;
  if (kind === "photos") {
    try {
      photoSize = readImageSize(buffer);
    } catch {
      return NextResponse.json({ error: "Not a readable PNG or JPEG." }, { status: 400 });
    }
  }

  await mkdir(dir, { recursive: true });
  await writeFile(filePath, buffer);

  const src = `/media/${kind}/${baseName}${extension}`;
  return NextResponse.json(photoSize ? { src, ...photoSize } : { src }, { status: 201 });
}
