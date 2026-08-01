import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/brand/Wordmark";
import { getNextShow } from "@/lib/content/shows";

/**
 * Stage 1 smoke-test stub only — exercises the layout, i18n, fonts, theme
 * tokens, and the markdown content layer end to end. Replaced by the real
 * landing page (Hero, Marquee, BandBlurb, MemberGrid, NextShowCard) in
 * Stage 4.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("Shows");
  const nextShow = await getNextShow();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Wordmark color="var(--color-gold)" width={280} />
      <p className="text-steel-text font-mono text-xs tracking-widest uppercase">
        Stage 1 foundation smoke test — replaced by the real landing page in Stage 4
      </p>
      {nextShow ? (
        <div className="border-gold text-bone font-mono border p-4 text-sm">
          <p className="text-gold tracking-wide uppercase">{t("nextShow")}</p>
          <p>
            {new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(
              new Date(nextShow.date),
            )}
          </p>
          <p>
            {nextShow.venue} · {nextShow.city}
          </p>
          <p className="uppercase">{t(`status.${nextShow.status}`)}</p>
        </div>
      ) : (
        <p>No upcoming shows.</p>
      )}
    </div>
  );
}
