import { getTranslations } from "next-intl/server";
import { SadMask } from "@/components/brand/SadMask";
import { Footer } from "@/components/layout/Footer";
import { CtaButton } from "@/components/ui/CtaButton";
import { spotifyUrl, youtubeUrl } from "@/content/social";
import { Link } from "@/i18n/navigation";

/**
 * Segment-level 404 for anything under /[locale]/** (a stale news slug,
 * a removed show, a mistyped path) — rendered *inside* the already-
 * successful app/[locale]/layout.tsx, so it keeps the header, the gold
 * texture, and the site chrome instead of falling through to Next's
 * unbranded synthesized /_not-found. (The one case this can't cover is
 * an invalid `locale` segment itself: that notFound() call happens
 * inside the layout before it renders, so Next uses the root fallback
 * for that case instead — a much rarer path than a stale content link.)
 *
 * A dead end is the one page where a visitor has nothing to do next, so
 * it offers the two streaming links rather than only pointing home —
 * this is the site's cheapest place to convert a broken link into a
 * listen.
 */
export default async function LocaleNotFound() {
  // Deliberately no `locale` param: Next renders a not-found boundary
  // without the segment's params, so reading `params.locale` here only
  // ever fell through to a default — which quietly served German copy
  // under English chrome on /en. The locale comes from next-intl's
  // request scope instead, which app/[locale]/layout.tsx has already
  // pinned via setRequestLocale() by the time this boundary renders.
  const t = await getTranslations("Nav");

  return (
    <>
      <div className="gutter-x mx-auto max-w-2xl py-24 text-center">
        <p className="text-meta font-mono tracking-widest text-gold uppercase">
          404
        </p>
        <SadMask size={132} title={t("notFoundMaskAlt")} className="mt-8" />
        <h1 className="font-display mt-8 text-3xl text-bone uppercase">
          {t("notFoundTitle")}
        </h1>
        <p className="text-body mt-3 text-bone/80">{t("notFoundBody")}</p>

        <p className="text-body mt-12 text-bone">{t("notFoundMusic")}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <CtaButton href={spotifyUrl}>Spotify →</CtaButton>
          <CtaButton href={youtubeUrl} variant="outline">
            YouTube →
          </CtaButton>
        </div>

        <Link
          href="/"
          className="text-meta mt-8 inline-block font-mono tracking-wide text-gold uppercase hover:text-gold-hi"
        >
          {t("home")} →
        </Link>
      </div>
      <Footer variant="live" />
    </>
  );
}
