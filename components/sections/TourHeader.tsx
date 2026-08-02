import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/sections/PageHeader";
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
    <PageHeader eyebrow={t("eyebrow")} title={t("title")}>
      {shows.length > 0 && first && last && (
        <p className="text-meta text-steel-text mt-3 font-mono tracking-wide uppercase">
          {t("dateCount", { count: shows.length })} · {formatRange(first.date, last.date, locale)}
        </p>
      )}
    </PageHeader>
  );
}
