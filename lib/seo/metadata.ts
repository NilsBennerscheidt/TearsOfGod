import type { Metadata } from "next";
import { band } from "@/content/band";
import { routing, type AppLocale } from "@/i18n/routing";

interface PageMetadataOptions {
  locale: AppLocale;
  /**
   * The route path *without* its locale prefix — "" for the locale root,
   * "/tour", "/news/some-slug". The prefix is added here so the canonical
   * and every hreflang alternate are built from one path, and can't drift
   * apart the way three separately-written URLs can.
   */
  path?: string;
  /** Runs through the layout's `%s — Tears of God` template unless `absoluteTitle`. */
  title: string;
  description: string;
  /** For the landing page, whose title already names the band and must not get the suffix twice. */
  absoluteTitle?: boolean;
  /** Defaults to "website"; news posts pass "article". */
  type?: "website" | "article";
  images?: NonNullable<Metadata["openGraph"]>["images"];
  publishedTime?: string;
  /**
   * Which locales actually have this page, when that isn't all of them.
   * News posts are the case: a post with only a German file is absent
   * from /en entirely (see postFrontmatterSchema — there is deliberately
   * no cross-locale fallback), so advertising an English alternate for it
   * points hreflang at a 404. Defaults to every locale, which is correct
   * for every static route.
   */
  availableLocales?: readonly AppLocale[];
}

/**
 * Per-page metadata: canonical, hreflang alternates, and the OpenGraph
 * block, all derived from one `path`.
 *
 * Every page must call this. app/[locale]/layout.tsx deliberately no
 * longer declares `alternates` at all — it used to set
 * `canonical: /${locale}`, which every page inherited verbatim, so /en/tour,
 * /en/band and /en/news all declared /en as their canonical URL and asked
 * search engines to drop them from the index in favour of the landing
 * page. A missing canonical is recoverable (a crawler falls back to the
 * URL it fetched); a confidently wrong one is not, so there is no
 * site-wide default to silently inherit any more.
 *
 * OpenGraph title/description are set here rather than left to the layout
 * for the same reason: metadata.openGraph is replaced wholesale by a
 * child, never merged field-by-field, and the title template does not
 * apply to it — so the layout's og:title rode along unchanged on every
 * subpage, and every share of /en/tour rendered as the landing page.
 */
export function pageMetadata({
  locale,
  path = "",
  title,
  description,
  absoluteTitle = false,
  type = "website",
  images,
  publishedTime,
  availableLocales = routing.locales,
}: PageMetadataOptions): Metadata {
  const canonical = `/${locale}${path}`;
  // og:title gets no template applied, so spell out what the <title> will
  // resolve to rather than shipping a bare "Shows" to every share card.
  const displayTitle = absoluteTitle ? title : `${title} — ${band.name}`;
  const ogImages = images ?? (band.groupPhoto ? [{ url: band.groupPhoto }] : []);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(availableLocales.map((l) => [l, `/${l}${path}`])),
        /*
         * The unprefixed path, not /de. middleware.ts negotiates a locale
         * for any path without a prefix (Accept-Language, or the visitor's
         * stored choice), which is exactly what x-default describes: the
         * URL to send a reader whose language we don't publish. Hardcoding
         * /de would instead send a French or Japanese reader to German —
         * the outcome middleware.ts documents as the wrong one.
         */
        ...(availableLocales.length === routing.locales.length && {
          "x-default": path === "" ? "/" : path,
        }),
      },
    },
    openGraph: {
      type,
      locale,
      siteName: band.name,
      title: displayTitle,
      description,
      // Resolved against metadataBase (set in app/[locale]/layout.tsx).
      url: canonical,
      images: ogImages,
      ...(publishedTime && { publishedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description,
    },
  };
}
