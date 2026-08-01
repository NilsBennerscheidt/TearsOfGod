import { getTranslations } from "next-intl/server";
import { Halftone } from "@/components/brand/Halftone";
import { PhotoPlaceholder } from "@/components/brand/PhotoPlaceholder";
import { TearHalo } from "@/components/brand/TearHalo";
import { Wordmark } from "@/components/brand/Wordmark";
import { CtaButton } from "@/components/ui/CtaButton";
import type { Release } from "@/content/releases";

interface HeroProps {
  release: Release;
}

/**
 * Listen/Watch have no real destination yet — no streaming links exist
 * anywhere in the source material. Rendered as disabled CtaButtons
 * (no fabricated href) rather than shipping a broken or fake link.
 */
export async function Hero({ release }: HeroProps) {
  const t = await getTranslations("Landing");

  return (
    <div className="relative flex h-[80vh] min-h-130 flex-col justify-end overflow-hidden">
      <PhotoPlaceholder label="LIVE · MOTION BLUR · B&W" style={{ position: "absolute", inset: 0 }} />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(11,10,8,0.45) 0%, rgba(11,10,8,0.92) 100%)" }}
      />
      <Halftone size={3} color="var(--color-gold)" opacity={0.06} />

      <h1 className="absolute inset-x-0 top-[16%] flex justify-center">
        <Wordmark color="var(--color-gold)" width={620} className="h-auto w-[76vw] max-w-225" />
      </h1>

      <div className="relative flex flex-col items-start justify-between gap-8 p-6 md:flex-row md:items-end md:p-10">
        <div className="max-w-md">
          <p className="text-meta font-mono tracking-widest text-gold uppercase">{t("releaseEyebrow")}</p>
          <p className="text-hero font-brutal tracking-[-0.03em] text-bone uppercase">
            SALT
            <br />
            <span className="text-blood-text">AND</span> SWEAT.
          </p>
          <p className="sr-only">{release.title}</p>
          <div className="mt-3 flex gap-3">
            <CtaButton disabledLabel={t("comingSoon")}>{t("listen")} →</CtaButton>
            <CtaButton variant="outline" disabledLabel={t("comingSoon")}>
              {t("watch")}
            </CtaButton>
          </div>
        </div>
        <TearHalo size={90} color="var(--color-gold)" strokeW={1.4} className="hidden sm:block" />
      </div>
    </div>
  );
}
