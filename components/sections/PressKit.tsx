import { getTranslations } from "next-intl/server";
import { CtaButton } from "@/components/ui/CtaButton";
import { band } from "@/content/band";
import { pressKit } from "@/content/press";

/**
 * Contents manifest + a single ZIP download. `pressKit.href` assumes the
 * file lives at public/presskit/tears-of-god-presskit.zip — drop the
 * actual file there; CtaButton's `download`-less <a> would still resolve
 * once it exists, since public/ files are served verbatim.
 */
export async function PressKit({ locale }: { locale: string }) {
  const t = await getTranslations("Press");
  const updated = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(pressKit.lastUpdated),
  );

  return (
    <div className="tog-gold-glow-box border border-gold bg-ink p-6">
      <h2 className="font-display text-2xl text-gold uppercase">{t("heading")}</h2>
      <p className="text-body mt-2 max-w-prose text-bone/85">{t("description")}</p>

      <p className="text-meta mt-4 font-mono tracking-widest text-steel-text uppercase">{t("contentsHeading")}</p>
      <ul className="text-body mt-1 list-disc pl-5 text-bone/85">
        {pressKit.contentsKeys.map((key) => (
          <li key={key}>{t(`contents.${key}`)}</li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <CtaButton href={pressKit.href} download>
          {t("download")}
        </CtaButton>
        <p className="text-meta text-steel-text uppercase">
          {t("lastUpdated")}: {updated}
        </p>
      </div>

      <p className="text-meta mt-4 font-mono tracking-wide text-steel-text uppercase">
        {t("contact")} ·{" "}
        <a href={`mailto:${band.contactEmail}`} className="text-gold">
          {band.contactEmail}
        </a>
      </p>
    </div>
  );
}
