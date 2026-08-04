import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/layout/Footer";
import { ShowTable } from "@/components/sections/ShowTable";
import { TourHeader } from "@/components/sections/TourHeader";
import { getUpcomingShows } from "@/lib/content/shows";
import { musicEventJsonLd } from "@/lib/seo/musicEvent";

// getUpcomingShows() filters against `new Date()` at render time — without
// this, a statically-prerendered page freezes that filter at build time,
// so a show that's already happened never leaves the page (and the "next
// show" it feeds on the landing page never advances) until the next
// deploy. An hour is frequent enough that a page never advertises a past
// show for long, without turning this into an on-demand route.
export const revalidate = 3600;

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
      <Footer variant="live" />
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
