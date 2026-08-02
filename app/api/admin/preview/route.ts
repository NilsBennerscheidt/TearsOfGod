import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/admin/guards";
import { renderMarkdown } from "@/lib/content/markdown";

export const runtime = "nodejs";

const schema = z.object({ markdown: z.string() });

export async function POST(request: NextRequest) {
  const guard = await adminGuard();
  if (guard) return guard;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Expected { "markdown": string }' }, { status: 400 });
  }

  const html = await renderMarkdown(parsed.data.markdown);
  return NextResponse.json({ html });
}
