import { getTranslations } from "next-intl/server";
import { GoldText } from "@/components/brand/GoldText";
import { RegCross } from "@/components/brand/RegMarks";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { TicketStatus } from "@/components/ui/TicketStatus";
import { getNextShow } from "@/lib/content/shows";

interface NextShowCardProps {
  locale: string;
}

/**
 * Self-contained: fetches its own data via getNextShow() rather than
 * requiring the page to fetch-then-pass. getShows()/getNextShow() are
 * wrapped in React's cache(), so this doesn't cost an extra filesystem
 * read even if something else on the page also calls getNextShow().
 */
export async function NextShowCard({ locale }: NextShowCardProps) {
  const [t, show] = await Promise.all([getTranslations(), getNextShow()]);

  if (!show) {
    return (
      <div className="border border-gold bg-ink p-4">
        <SectionEyebrow>{t("Landing.nextShowEyebrow")}</SectionEyebrow>
        <p className="text-body mt-3 text-bone/80">{t("Landing.noUpcomingShows")}</p>
      </div>
    );
  }

  const date = new Date(show.date);
  const day = new Intl.DateTimeFormat(locale, { day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat(locale, { month: "2-digit" }).format(date);
  const year = new Intl.DateTimeFormat(locale, { year: "2-digit" }).format(date);

  return (
    <div className="tog-gold-glow-box relative border border-gold bg-ink p-4">
      <SectionEyebrow>{t("Landing.nextShowEyebrow")}</SectionEyebrow>
      <p className="text-next-show-date font-brutal mt-2 leading-none tracking-[-0.03em] text-bone">
        {day}.
        <br />
        {month}.{year}
      </p>
      <GoldText as="p" glow className="text-venue font-display mt-2">
        {show.venue}
      </GoldText>
      <p className="text-meta mt-1 tracking-wide text-steel-text uppercase">{show.city}</p>
      <div className="mt-4">
        <TicketStatus status={show.status} label={t(`Shows.status.${show.status}`)} href={show.ticketUrl} />
      </div>
      <RegCross color="var(--color-gold)" size={14} className="absolute top-3 right-3" />
    </div>
  );
}
