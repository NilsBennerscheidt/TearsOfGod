import { band } from "@/content/band";
import type { AppLocale } from "@/i18n/routing";
import { BAND_ID } from "./musicGroup";
import { absoluteUrl } from "./site";
import type { ShowStatus } from "@/lib/schemas/show";
import type { Show } from "@/types/content";

const AVAILABILITY: Record<ShowStatus, string> = {
  available: "https://schema.org/InStock",
  "few-left": "https://schema.org/LimitedAvailability",
  "sold-out": "https://schema.org/SoldOut",
};

/**
 * MusicEvent structured data for one show — offers.availability mapped
 * from ShowStatus, offers.url pointing at the external ticketUrl.
 *
 * `performer` references the MusicGroup by @id (lib/seo/musicGroup.ts)
 * rather than only by name, so the shows and the band read as one graph
 * instead of unrelated events that happen to share a performer name. The
 * name stays alongside it so the event is still valid read on its own.
 */
export function musicEventJsonLd(show: Show, locale: AppLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: show.name ?? `${band.name} — ${show.venue}`,
    startDate: show.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    // Shows have no page of their own — they are listed on /tour, which
    // is the URL a result for this event should lead to.
    url: absoluteUrl(`/${locale}/tour`),
    location: {
      "@type": "Place",
      name: show.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: show.city,
        // From the show, not hardcoded "DE" — a Prague date announced as
        // being in Germany is worse than no structured data at all.
        addressCountry: show.country,
      },
    },
    performer: {
      "@type": "MusicGroup",
      "@id": BAND_ID,
      name: band.name,
    },
    ...(show.ticketUrl && {
      offers: {
        "@type": "Offer",
        url: show.ticketUrl,
        availability: AVAILABILITY[show.status],
        /*
         * Only a real door price. `price` is never rendered anywhere in
         * the UI, so a show carrying `door: 0` (content/shows/
         * 2026-10-29-prague.md) is one nobody filled in — not one with
         * free admission. Publishing the 0 tells Google the concert is
         * free, which is a harder error to take back than saying nothing
         * about the price at all.
         */
        ...(show.price && show.price.door > 0 && {
          price: show.price.door,
          priceCurrency: show.price.currency,
        }),
      },
    }),
  };
}
