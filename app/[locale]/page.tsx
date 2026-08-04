import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/layout/Footer";
import { BandBlurb } from "@/components/sections/BandBlurb";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { MemberGrid } from "@/components/sections/MemberGrid";
import { NextShowCard } from "@/components/sections/NextShowCard";
import { currentRelease } from "@/content/releases";
import { slogans } from "@/content/slogans";

// NextShowCard reads getNextShow(), which filters against `new Date()` —
// see the identical comment on app/[locale]/tour/page.tsx's revalidate.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");
  return {
    title: "Tears of God",
    description: t("bandBody"),
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <>
      <Hero release={currentRelease} />
      <Marquee items={slogans.marquee} />
      <div className="gutter-x grid gap-8 py-10 md:grid-cols-[1.3fr_1fr] md:gap-10 md:py-14">
        <div>
          <BandBlurb />
          <MemberGrid />
        </div>
        <NextShowCard locale={locale} />
      </div>
      <Footer variant="landing" />
    </>
  );
}
