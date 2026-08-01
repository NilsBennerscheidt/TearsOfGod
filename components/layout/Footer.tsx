import { getTranslations } from "next-intl/server";
import { LogoMonogram } from "@/components/brand/LogoMonogram";
import { MetaStrip } from "@/components/brand/MetaStrip";
import { band } from "@/content/band";
import { slogans } from "@/content/slogans";
import { Link } from "@/i18n/navigation";
import { SocialLinks } from "./SocialLinks";

interface FooterProps {
  variant?: "landing" | "tour";
}

/**
 * Impressum/Datenschutz links are rendered on every variant — German
 * law (DDG) requires the Impressum be reachable from every page, not
 * just a subset. The pages themselves aren't built yet (later stage);
 * these links are correct per the approved route list regardless.
 */
export async function Footer({ variant = "landing" }: FooterProps) {
  const t = await getTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="gutter-x safe-b border-t border-ash pt-8">
      {variant === "landing" ? (
        <div className="flex items-center justify-between gap-4">
          <LogoMonogram size={28} title="Tears of God" />
          {/* Previously a static "IG · YT · SPOTIFY · BANDCAMP" string — it wasn't clickable and advertised a Bandcamp that doesn't exist. Real links now live in the row below. */}
          <MetaStrip left={t("Footer.copyright", { year })} right={`${band.city} · ${band.postalCode}`} />
        </div>
      ) : (
        <div className="text-meta flex flex-col gap-4 font-mono tracking-wide uppercase md:flex-row md:items-center md:justify-between">
          <span className="text-steel-text">{slogans.tourCreed}</span>
          <a href={`mailto:${band.contactEmail}`} className="text-gold">
            BOOKING · {band.contactEmail.toUpperCase()}
          </a>
        </div>
      )}
      {/* Socials sit on both variants — reachable from every page, not just the landing page. */}
      <div className="mt-6 border-t border-ash pt-2">
        <SocialLinks label={t("Footer.social")} />
      </div>
      <div className="text-meta text-steel-text flex gap-4 font-mono tracking-wide uppercase">
        <Link href="/impressum" className="inline-flex min-h-11 items-center hover:text-bone">
          {t("Legal.impressum")}
        </Link>
        <Link href="/datenschutz" className="inline-flex min-h-11 items-center hover:text-bone">
          {t("Legal.datenschutz")}
        </Link>
      </div>
    </footer>
  );
}
