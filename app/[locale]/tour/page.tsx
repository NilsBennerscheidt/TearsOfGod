import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { parseLocale } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { ShowTable } from "@/components/sections/ShowTable";
import { TourHeader } from "@/components/sections/TourHeader";
import { getUpcomingShows } from "@/lib/content/shows";
import { musicEventJsonLd } from "@/lib/seo/musicEvent";
import { tourYears } from "@/lib/seo/tourYears";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";

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
  const [t, shows] = await Promise.all([getTranslations("Tour"), getUpcomingShows()]);
  return pageMetadata({
    locale: parseLocale(locale),
    path: "/tour",
    // getUpcomingShows() is React-cached, so this shares one filesystem
    // read with the page body below — the year in the title can't drift
    // from the year above the table.
    title: t("title", { years: tourYears(shows) }),
    description: t("metaDescription"),
  });
}


export default async function TourPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const appLocale = parseLocale(locale);
  const [t, nav, shows] = await Promise.all([
    getTranslations("Tour"),
    getTranslations("Nav"),
    getUpcomingShows(),
  ]);

  return (
    <>
      <TourHeader shows={shows} locale={locale} />
      <ShowTable shows={shows} locale={locale} />
      <Footer variant="live" />
      {/* Built from the same getUpcomingShows() the table renders, never a second copy of the list. */}
      {shows.map((show) => (
        <JsonLd key={show.slug} data={musicEventJsonLd(show, appLocale)} />
      ))}
      <JsonLd
        data={breadcrumbJsonLd(appLocale, nav("home"), [
          { name: t("title", { years: tourYears(shows) }), path: "/tour" },
        ])}
      />
    </>
  );
}
