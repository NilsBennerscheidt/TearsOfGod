import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/sections/PageHeader";
import { PhotoGrid } from "@/components/sections/PhotoGrid";
import { SocialGrid } from "@/components/sections/SocialGrid";
import { VideoGrid } from "@/components/sections/VideoGrid";
import { getMedia } from "@/lib/content/media";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Media");
  return { title: t("title") };
}

export default async function MediaPage({ params }: { params: Promise<{ locale: string }> }) {
  // Locale isn't otherwise needed here — everything on this page is
  // locale-independent besides its own translated strings. Still awaited:
  // Next only prerenders a page against the parent layout's
  // generateStaticParams when the page itself resolves `params`: leaving
  // it untouched makes the whole route render on-demand instead of
  // statically, even though nothing else here is actually dynamic.
  await params;
  const [t, { photos, videos }] = await Promise.all([getTranslations("Media"), getMedia()]);

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <div className="gutter-x flex flex-col gap-12 py-10 md:py-14">
        <section>
          <h2 className="font-display mb-4 text-2xl text-gold uppercase">{t("photosHeading")}</h2>
          <PhotoGrid photos={photos} emptyLabel={t("emptyPhotos")} />
        </section>

        <section>
          <h2 className="font-display mb-4 text-2xl text-gold uppercase">{t("videosHeading")}</h2>
          <VideoGrid videos={videos} emptyLabel={t("emptyVideos")} />
        </section>

        <section>
          <h2 className="font-display mb-4 text-2xl text-gold uppercase">{t("socialsHeading")}</h2>
          <SocialGrid />
        </section>
      </div>
      <Footer variant="live" />
    </>
  );
}
