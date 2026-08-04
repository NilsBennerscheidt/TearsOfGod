import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/admin/guards";
import { INVALID_JSON, readJson } from "@/lib/admin/read-json";
import { renderMarkdown } from "@/lib/content/markdown";

export const runtime = "nodejs";

const schema = z.object({ markdown: z.string() });

export async function POST(request: NextRequest) {
  const guard = await adminGuard();
  if (guard) return guard;

  const raw = await readJson(request);
  if (raw === INVALID_JSON) {
    return NextResponse.json({ error: "Request body is not valid JSON." }, { status: 400 });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Expected { "markdown": string }' }, { status: 400 });
  }

  const html = await renderMarkdown(parsed.data.markdown);
  return NextResponse.json({ html });
}
