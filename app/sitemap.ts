import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo/site";
import { getPosts } from "@/lib/content/posts";

const STATIC_ROUTES = [
  "",
  "/tour",
  "/media",
  "/news",
  "/band",
  "/games",
  "/games/whack",
  "/games/invaders",
  "/games/runner",
  "/games/snake",
  "/games/maze",
  "/impressum",
  "/datenschutz",
] as const;

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
      entries.push({
        url: `${SITE_URL}/${locale}${route}`,
        // Deliberately no lastModified: it would be `new Date()`, i.e. the
        // build time, telling a crawler every page changed on every deploy
        // even when none did. An absent value says "unknown", which is
        // true, rather than a claim that is reliably wrong. Posts below
        // carry a real date, so they keep theirs.
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${SITE_URL}/${l}${route}`]),
          ),
        },
      });
    }
  }

  routing.locales.forEach((locale, i) => {
    for (const post of postsByLocale[i] ?? []) {
      // A post exists only in the locales it has a file for, so its
      // alternates are the locales that actually list this slug — not
      // routing.locales (see the doc comment on postFrontmatterSchema).
      const languages = Object.fromEntries(
        routing.locales
          .filter((l, j) => (postsByLocale[j] ?? []).some((other) => other.slug === post.slug))
          .map((l) => [l, `${SITE_URL}/${l}/news/${post.slug}`]),
      );
      entries.push({
        url: `${SITE_URL}/${locale}/news/${post.slug}`,
        lastModified: new Date(post.date),
        alternates: { languages },
      });
    }
  });

  return entries;
}
