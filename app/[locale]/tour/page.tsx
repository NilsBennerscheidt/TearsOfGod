import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/layout/Footer";
import { ShowTable } from "@/components/sections/ShowTable";
import { TourHeader } from "@/components/sections/TourHeader";
import { getUpcomingShows } from "@/lib/content/shows";
import { musicEventJsonLd } from "@/lib/seo/musicEvent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Tour");
  return { title: t("title") };
}

export default async function TourPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const shows = await getUpcomingShows();

  return (
    <>
      <TourHeader shows={shows} locale={locale} />
      <ShowTable shows={shows} locale={locale} />
      <Footer variant="tour" />
      {shows.map((show) => (
        <script
          key={show.slug}
          type="application/ld+json"
          // Safe: every field comes from Zod-validated markdown frontmatter, not user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(musicEventJsonLd(show)) }}
        />
      ))}
    </>
  );
}
