import { getTranslations } from "next-intl/server";
import { TicketStatus } from "@/components/ui/TicketStatus";
import type { Show } from "@/types/content";

interface ShowTableProps {
  shows: Show[];
  locale: string;
}

export async function ShowTable({ shows, locale }: ShowTableProps) {
  const t = await getTranslations("Shows");

  if (shows.length === 0) {
    const tt = await getTranslations("Tour");
    return <p className="text-body p-6 text-bone/80">{tt("noUpcomingShows")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-150 border-collapse">
        <thead>
          <tr className="text-meta border-b border-ash font-mono tracking-widest text-gold uppercase">
            <th scope="col" className="px-2 py-3 text-left">
              {t("date")}
            </th>
            <th scope="col" className="hidden px-2 py-3 text-left sm:table-cell">
              {t("day")}
            </th>
            <th scope="col" className="px-2 py-3 text-left">
              {t("city")}
            </th>
            <th scope="col" className="px-2 py-3 text-left">
              {t("venue")}
            </th>
            <th scope="col" className="px-2 py-3 text-right">
              {t("tickets")}
            </th>
          </tr>
        </thead>
        <tbody>
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
    <tr className="border-b border-ash">
      <td className="font-brutal px-2 py-4 text-sm tracking-[-0.02em] text-bone">{dateFmt}</td>
      <td className="text-meta hidden px-2 py-4 text-steel-text sm:table-cell">{dayFmt}</td>
      <td className="font-brutal px-2 py-4 text-base tracking-[-0.02em] text-bone">{show.city}</td>
      <td className="px-2 py-4">
        <p className="text-venue font-display leading-tight text-gold">{show.venue}</p>
        {/* Real, distinguishing data — both current shows share the same date/city/venue and differ only by which bill/event this is. */}
        {show.name && <p className="text-meta mt-0.5 text-steel-text">{show.name}</p>}
      </td>
      <td className="px-2 py-4 text-right">
        <TicketStatus status={show.status} label={statusLabel} href={show.ticketUrl} />
      </td>
    </tr>
  );
}
