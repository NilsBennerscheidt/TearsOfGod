import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals, Vercel internals, the local-only
  // admin tool (its own root layout outside [locale] — see
  // app/admin/layout.tsx — would otherwise get redirected to /de/admin
  // by next-intl), and any request for a file with an extension (assets,
  // favicon, etc.).
  matcher: ["/((?!api|trpc|_next|_vercel|admin|.*\\..*).*)"],
};
