import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PhotoPlaceholder } from "@/components/brand/PhotoPlaceholder";
import { Footer } from "@/components/layout/Footer";
import { MemberCards } from "@/components/sections/MemberCards";
import { PageHeader } from "@/components/sections/PageHeader";
import { band } from "@/content/band";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("We");
  return { title: t("title") };
}

export default async function BandPage({ params }: { params: Promise<{ locale: string }> }) {
  // See the identical comment in app/[locale]/media/page.tsx — awaiting
  // params (even though its value is unused) is what makes Next prerender
  // this page statically against the layout's generateStaticParams.
  await params;
  const t = await getTranslations("We");

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <div className="gutter-x flex flex-col gap-10 py-10 md:py-14">
        <div className="border border-ash">
          {band.groupPhoto ? (
            <Image src={band.groupPhoto} alt={band.name} width={1600} height={900} className="w-full object-cover" />
          ) : (
            <PhotoPlaceholder label="GROUP · CASTROP-RAUXEL" aspect="16 / 9" />
          )}
        </div>

        <div>
          <h2 className="text-section-h2 font-display leading-none text-bone uppercase">{t("storyHeadline")}</h2>
          <p className="text-body mt-3 max-w-prose leading-relaxed text-bone/85">
            {t("storyBody", { foundedYear: band.foundedYear })}
          </p>
          <dl className="text-meta mt-6 flex flex-wrap gap-x-10 gap-y-2 font-mono tracking-wide text-steel-text uppercase">
            <div>
              <dt className="inline">{t("factsFounded")}: </dt>
              <dd className="inline text-gold">{band.foundedYear}</dd>
            </div>
            <div>
              <dt className="inline">{t("factsBase")}: </dt>
              <dd className="inline text-gold">
                {band.city} · {band.postalCode}
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="font-display text-2xl text-gold uppercase">{t("membersHeading")}</h2>
          <MemberCards />
        </div>
      </div>
      <Footer variant="live" />
    </>
  );
}
