import { getTranslations } from "next-intl/server";
import { Halftone } from "@/components/brand/Halftone";
import { PhotoPlaceholder } from "@/components/brand/PhotoPlaceholder";
import { TearHalo } from "@/components/brand/TearHalo";
import { Wordmark } from "@/components/brand/Wordmark";
import { CtaButton } from "@/components/ui/CtaButton";
import type { Release } from "@/content/releases";
import { youtubeUrl } from "@/content/social";

interface HeroProps {
  release: Release;
}

/**
 * Listen → the release's Spotify link, Watch → the YouTube channel, both
 * from the content layer. If either URL is removed there, CtaButton
 * degrades to its disabled state rather than rendering a dead link.
 */
export async function Hero({ release }: HeroProps) {
  const t = await getTranslations("Landing");

  return (
    // dvh, not vh: `vh` resolves against the viewport with mobile browser
    // chrome hidden, so with the URL bar showing the hero overflows the
    // screen and pushes the CTAs below the fold until chrome retracts.
    <div className="relative flex h-[80dvh] min-h-130 flex-col justify-end overflow-hidden">
      <PhotoPlaceholder label="LIVE · MOTION BLUR · B&W" style={{ position: "absolute", inset: 0 }} />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(11,10,8,0.45) 0%, rgba(11,10,8,0.92) 100%)" }}
      />
      <Halftone size={3} color="var(--color-gold)" opacity={0.06} />

      <h1 className="absolute inset-x-0 top-[16%] flex justify-center">
        {/* No `width` prop: an inline width would override the responsive class. */}
        <Wordmark color="var(--color-gold)" className="w-[76vw] max-w-225" />
      </h1>

      <div className="gutter-x safe-b relative flex flex-col items-start justify-between gap-8 pt-6 md:flex-row md:items-end md:pt-10">
        <div className="max-w-md">
          <p className="text-meta font-mono tracking-widest text-gold uppercase">{t("releaseEyebrow")}</p>
          <p className="text-hero font-brutal tracking-[-0.03em] text-bone uppercase">
            SALT
            <br />
            <span className="text-blood-text">AND</span> SWEAT.
          </p>
          <p className="sr-only">{release.title}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {/* Both fall back to the disabled state automatically if a URL is ever removed from content. */}
            <CtaButton href={release.listenUrl} disabledLabel={t("comingSoon")}>
              {t("listen")} →
            </CtaButton>
            <CtaButton variant="outline" href={youtubeUrl} disabledLabel={t("comingSoon")}>
              {t("watch")}
            </CtaButton>
          </div>
        </div>
        <TearHalo size={90} color="var(--color-gold)" strokeW={1.4} className="hidden sm:block" />
      </div>
    </div>
  );
}
