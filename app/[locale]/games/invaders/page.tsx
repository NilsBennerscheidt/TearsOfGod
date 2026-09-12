import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { parseLocale } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InvadersMount } from "@/components/games/invaders/InvadersMount";
import { Footer } from "@/components/layout/Footer";

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
  return pageMetadata({
    locale: parseLocale(locale),
    path: "/games/invaders",
    title: t("invaders.title"),
    description: t("invaders.tagline"),
  });
}

/**
 * Server Component. Everything interactive lives behind InvadersMount,
 * which is what makes the game a client-only chunk — see WhackMount's
 * doc comment for why the split is required rather than stylistic.
 */
export default async function InvadersPage({ params }: { params: Promise<{ locale: string }> }) {
  // See the note in app/[locale]/games/whack/page.tsx — awaiting params,
  // unused, is what keeps this route statically prerendered.
  await params;

  const t = await getTranslations("Games");

  return (
    <>
      {/*
        The document's h1. It is sr-only because the visible title lives
        inside InvadersMount's client-only, full-screen portal, which is
        not in the server-rendered HTML — without this the route ships no
        h1 at all. Exactly one per page: GameShell renders the visible
        title as a <p>.
      */}
      <h1 className="sr-only">{t("invaders.title")}</h1>
      <InvadersMount />
      <Footer variant="live" />
    </>
  );
}
