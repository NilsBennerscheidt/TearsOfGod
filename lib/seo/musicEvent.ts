import { band } from "@/content/band";
import type { ShowStatus } from "@/lib/schemas/show";
import type { Show } from "@/types/content";

const AVAILABILITY: Record<ShowStatus, string> = {
  available: "https://schema.org/InStock",
  "few-left": "https://schema.org/LimitedAvailability",
  "sold-out": "https://schema.org/SoldOut",
};

/** MusicEvent structured data for one show — offers.availability mapped from ShowStatus, offers.url pointing at the external ticketUrl. */
export function musicEventJsonLd(show: Show) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: show.name ?? `${band.name} — ${show.venue}`,
    startDate: show.date,
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: show.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: show.city,
        addressCountry: "DE",
      },
    },
    performer: {
      "@type": "MusicGroup",
      name: band.name,
    },
    ...(show.ticketUrl && {
      offers: {
        "@type": "Offer",
        url: show.ticketUrl,
        availability: AVAILABILITY[show.status],
        ...(show.price && {
          price: show.price.door,
          priceCurrency: show.price.currency,
        }),
      },
    }),
  };
}
