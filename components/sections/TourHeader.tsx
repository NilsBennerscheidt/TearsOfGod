import { getTranslations } from "next-intl/server";
import type { Show } from "@/types/content";

interface TourHeaderProps {
  shows: Show[];
  locale: string;
}

function formatRange(startIso: string, endIso: string, locale: string): string {
  const fmt = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "2-digit" });
  const start = fmt.format(new Date(startIso));
  const end = fmt.format(new Date(endIso));
  return start === end ? start : `${start} – ${end}`;
}

/**
 * Deliberately generic ("Shows", a computed count + date range) rather
 * than the mockup's branded "TOUR · 2026 · LEG I — No False Idols":
 * that was a fictional 8-city run invented for the design comp. The real
 * booking data is two individual, unrelated shows (different bills,
 * different ticket vendors) — presenting them as a named tour leg would
 * fabricate a narrative the real data doesn't support.
 */
export async function TourHeader({ shows, locale }: TourHeaderProps) {
  const t = await getTranslations("Tour");
  const first = shows[0];
  const last = shows[shows.length - 1];

  return (
    <div className="border-b border-gold px-6 py-8 md:px-10 md:py-10">
      <p className="text-meta text-blood-text font-mono tracking-widest uppercase">{t("eyebrow")}</p>
      <h1 className="text-tour-h1 font-display mt-1 leading-none text-gold uppercase">{t("title")}</h1>
      {shows.length > 0 && first && last && (
        <p className="text-meta text-steel-text mt-3 font-mono tracking-wide uppercase">
          {t("dateCount", { count: shows.length })} · {formatRange(first.date, last.date, locale)}
        </p>
      )}
    </div>
  );
}
