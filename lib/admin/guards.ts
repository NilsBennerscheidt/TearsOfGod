import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

async function isLoopbackRequest(): Promise<boolean> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";
  return LOOPBACK_HOSTS.has(hostname);
}

/**
 * Two independent checks, both required, for every admin write route:
 *
 * 1. `NODE_ENV === "production"` — same precedent as
 *    app/[locale]/dev/kitchen-sink/page.tsx: this tool does not exist in
 *    a production build/deploy.
 * 2. The request's Host header is loopback — `next dev` defaults to
 *    binding all interfaces, so without this a laptop on a café Wi-Fi
 *    with `next dev` running is an open file-writer to anyone on the
 *    same network who finds the port. NODE_ENV alone only rules out
 *    production; it says nothing about who else can reach a dev server.
 *
 * Returns a 404 response if either check fails (matching notFound()'s
 * behavior in the page/layout guards — an admin route should look
 * absent, not merely forbidden), or null when the request may proceed.
 */
export async function adminGuard(): Promise<NextResponse | null> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!(await isLoopbackRequest())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return null;
}

/**
 * Same two checks as adminGuard(), for Server Components (app/admin/**
 * layout.tsx and page.tsx) instead of Route Handlers — calls next/navigation's
 * notFound() directly rather than returning a response, since that's how
 * a Server Component signals "render the 404 boundary" and no caller
 * needs to inspect a return value.
 */
export async function assertAdminAllowed(): Promise<void> {
  if (process.env.NODE_ENV === "production" || !(await isLoopbackRequest())) {
    notFound();
  }
}
