import { getTranslations } from "next-intl/server";
import { GoldText } from "@/components/brand/GoldText";
import { TicketStatus } from "@/components/ui/TicketStatus";
import type { Show } from "@/types/content";

interface ShowTableProps {
  shows: Show[];
  locale: string;
}

/**
 * One DOM, two layouts. Below `sm` the table reflows to stacked cards so
 * the ticket link — the whole point of this page — is never pushed off
 * screen behind a horizontal swipe on a 360px phone.
 *
 * Changing a table's `display` drops it out of the accessibility tree as
 * a table in several browsers, so every element carries its ARIA role
 * explicitly. That keeps row/column semantics intact in the stacked
 * layout without duplicating the markup, which would otherwise put the
 * same content in the DOM twice.
 */
export async function ShowTable({ shows, locale }: ShowTableProps) {
  const t = await getTranslations("Shows");

  if (shows.length === 0) {
    const tt = await getTranslations("Tour");
    return <p className="text-body gutter-x py-6 text-bone/80">{tt("noUpcomingShows")}</p>;
  }

  return (
    <div className="gutter-x">
      <table role="table" className="w-full border-collapse max-sm:block">
        {/* Kept in the a11y tree on mobile, just not shown: in the stacked layout each value is self-describing. */}
        <thead role="rowgroup" className="max-sm:sr-only">
          <tr role="row" className="text-meta border-b border-ash font-mono tracking-widest text-gold uppercase">
            <th role="columnheader" scope="col" className="py-3 pr-3 text-left">
              {t("date")}
            </th>
            <th role="columnheader" scope="col" className="hidden py-3 pr-3 text-left md:table-cell">
              {t("day")}
            </th>
            <th role="columnheader" scope="col" className="py-3 pr-3 text-left">
              {t("city")}
            </th>
            <th role="columnheader" scope="col" className="py-3 pr-3 text-left">
              {t("venue")}
            </th>
            <th role="columnheader" scope="col" className="py-3 text-right">
              {t("tickets")}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="max-sm:block">
          {shows.map((show) => (
            <ShowRow key={show.slug} show={show} locale={locale} statusLabel={t(`status.${show.status}`)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShowRow({ show, locale, statusLabel }: { show: Show; locale: string; statusLabel: string }) {
  const date = new Date(show.date);
  const dateFmt = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "2-digit" }).format(date);
  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date).toUpperCase();

  return (
    <tr role="row" className="border-b border-ash align-middle max-sm:block max-sm:py-5">
      <td
        role="cell"
        className="font-brutal py-4 pr-3 text-sm tracking-[-0.02em] text-bone max-sm:block max-sm:py-0 max-sm:text-gold"
      >
        {dateFmt}
        {/* The weekday has its own column from md up; on smaller screens it rides along with the date instead of being dropped. */}
        <span className="text-steel-text ml-2 font-mono text-xs md:hidden">{dayFmt}</span>
      </td>
      <td role="cell" className="text-meta hidden py-4 pr-3 text-steel-text md:table-cell">
        {dayFmt}
      </td>
      <td
        role="cell"
        className="font-brutal py-4 pr-3 text-base tracking-[-0.02em] text-bone max-sm:block max-sm:py-0 max-sm:text-xl"
      >
        {show.city}
      </td>
      <td role="cell" className="py-4 pr-3 max-sm:block max-sm:py-0">
        <GoldText as="p" glow className="text-venue font-display leading-tight">
          {show.venue}
        </GoldText>
        {show.name && <p className="text-meta mt-0.5 text-steel-text">{show.name}</p>}
      </td>
      <td role="cell" className="py-4 text-right max-sm:block max-sm:pt-3 max-sm:text-left">
        <TicketStatus status={show.status} label={statusLabel} href={show.ticketUrl} />
      </td>
    </tr>
  );
}
