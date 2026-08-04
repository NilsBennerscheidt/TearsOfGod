import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals, Vercel internals, the local-only
  // admin tool (its own root layout outside [locale] — see
  // app/admin/layout.tsx — would otherwise get redirected to /de/admin
  // by next-intl), and any request for a file with an extension (assets,
  // favicon, etc.). Each excluded segment is anchored with `(?:/|$)` —
  // a bare alternation like `api|admin` excludes anything that *starts
  // with* those letters (a future `/api-reference` or `/administration`
  // route would silently skip i18n too), not just the segment itself.
  matcher: ["/((?!(?:api|trpc|_next|_vercel|admin)(?:/|$)|.*\\..*).*)"],
};
