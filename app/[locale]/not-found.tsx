import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Footer } from "@/components/layout/Footer";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Segment-level 404 for anything under /[locale]/** (a stale news slug,
 * a removed show, a mistyped path) — rendered *inside* the already-
 * successful app/[locale]/layout.tsx, so it keeps the header, the gold
 * texture, and the site chrome instead of falling through to Next's
 * unbranded synthesized /_not-found. (The one case this can't cover is
 * an invalid `locale` segment itself: that notFound() call happens
 * inside the layout before it renders, so Next uses the root fallback
 * for that case instead — a much rarer path than a stale content link.)
 */
export default async function LocaleNotFound({ params }: { params?: Promise<{ locale: string }> }) {
  const requested = await params?.catch(() => undefined);
  const locale = requested && hasLocale(routing.locales, requested.locale) ? requested.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Nav" });

  return (
    <>
      <div className="gutter-x mx-auto max-w-2xl py-24 text-center">
        <p className="text-meta font-mono tracking-widest text-gold uppercase">404</p>
        <h1 className="font-display mt-2 text-3xl text-bone uppercase">{t("notFoundTitle")}</h1>
        <p className="text-body mt-3 text-bone/80">{t("notFoundBody")}</p>
        <Link
          href="/"
          className="text-meta mt-6 inline-block font-mono tracking-wide text-gold uppercase hover:text-gold-hi"
        >
          {t("home")} →
        </Link>
      </div>
      <Footer variant="live" />
    </>
  );
}
