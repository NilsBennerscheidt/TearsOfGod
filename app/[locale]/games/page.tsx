import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GameCard } from "@/components/games/GameCard";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/sections/PageHeader";

// Renders Footer, whose copyright year is `new Date().getFullYear()` —
// without this a static build freezes that year at build time. See the
// fuller comment on app/[locale]/tour/page.tsx's revalidate.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Games");
  return {
    title: t("title"),
    description: t("intro"),
  };
}

/**
 * The arcade index. Whack-a-Mole is live; the other two render as
 * non-interactive placeholder cards — GameCard takes no href for those,
 * so there is no link to a route that doesn't exist yet and nothing for
 * typedRoutes to reject.
 */
export default async function GamesPage({ params }: { params: Promise<{ locale: string }> }) {
  // See the identical comment in app/[locale]/band/page.tsx — awaiting
  // params (even though its value is unused) is what makes Next prerender
  // this page statically against the layout's generateStaticParams.
  await params;
  const t = await getTranslations("Games");

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />

      <section className="gutter-x py-8 md:py-10">
        <p className="text-body max-w-prose text-bone/85">{t("intro")}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <GameCard
            title={t("whack.title")}
            tagline={t("whack.tagline")}
            href="/games/whack"
            playLabel={t("play")}
            color="var(--color-gold)"
          />
          <GameCard
            title={t("invaders.title")}
            tagline={t("invaders.tagline")}
            href="/games/invaders"
            playLabel={t("play")}
            color="var(--color-blood-text)"
          />
          <GameCard
            title={t("runner.title")}
            tagline={t("runner.tagline")}
            href="/games/runner"
            playLabel={t("play")}
            color="var(--color-gold)"
          />
        </div>

        <p className="text-meta text-steel-text mt-8 font-mono tracking-wide">{t("scoresLocalNote")}</p>
      </section>

      <Footer variant="live" />
    </>
  );
}
