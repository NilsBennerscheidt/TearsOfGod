import { getTranslations } from "next-intl/server";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

export async function BandBlurb() {
  const t = await getTranslations("Landing");

  return (
    <div>
      <SectionEyebrow>{t("bandEyebrow")}</SectionEyebrow>
      <h2 className="text-section-h2 font-display mt-2 mb-3 leading-none text-bone uppercase">
        {t("bandHeadline")}
      </h2>
      <p className="text-body max-w-prose leading-relaxed text-bone/85">{t("bandBody")}</p>
    </div>
  );
}
