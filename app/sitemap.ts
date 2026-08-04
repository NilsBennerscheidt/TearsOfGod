import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getPosts } from "@/lib/content/posts";

const SITE_URL = "https://tearsofgod.net";

const STATIC_ROUTES = ["", "/tour", "/media", "/news", "/band", "/impressum", "/datenschutz"] as const;

/**
 * Every real page across both locales — static routes plus one entry per
 * post per locale it actually has a file for (see the doc comment on
 * postFrontmatterSchema: a post missing a translation is absent from
 * that locale, not faked with a fallback). Shows have no dedicated route
 * of their own (they're listed on /tour, not at /tour/<slug>), so they
 * don't get sitemap entries.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const postsByLocale = await Promise.all(routing.locales.map((locale) => getPosts(locale)));

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const route of STATIC_ROUTES) {
      entries.push({ url: `${SITE_URL}/${locale}${route}`, lastModified: new Date() });
    }
  }

  routing.locales.forEach((locale, i) => {
    for (const post of postsByLocale[i] ?? []) {
      entries.push({ url: `${SITE_URL}/${locale}/news/${post.slug}`, lastModified: new Date(post.date) });
    }
  });

  return entries;
}
