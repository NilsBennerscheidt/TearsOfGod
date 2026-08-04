import type { MetadataRoute } from "next";

const SITE_URL = "https://tearsofgod.net";

/** /admin is dev-only (see lib/admin/guards.ts — a production build 404s the whole subtree already), but disallowing it here too costs nothing and keeps a stray crawl from ever showing it in results if that guard is ever loosened. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
