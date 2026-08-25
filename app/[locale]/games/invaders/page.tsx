import type { Metadata } from "next";
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
  return {
    title: t("invaders.title"),
    description: t("invaders.tagline"),
  };
}

/**
 * Server Component. Everything interactive lives behind InvadersMount,
 * which is what makes the game a client-only chunk — see WhackMount's
 * doc comment for why the split is required rather than stylistic.
 */
export default async function InvadersPage({ params }: { params: Promise<{ locale: string }> }) {
  // See the identical comment in app/[locale]/band/page.tsx — awaiting
  // params (even though its value is unused) is what makes Next prerender
  // this page statically against the layout's generateStaticParams.
  await params;

  return (
    <>
      <InvadersMount />
      <Footer variant="live" />
    </>
  );
}
