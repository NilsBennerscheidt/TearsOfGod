import { band, members } from "@/content/band";
import { socials } from "@/content/social";
import type { AppLocale } from "@/i18n/routing";
import { absoluteUrl, SITE_URL } from "./site";

/**
 * Stable identifier for the band as an entity, referenced from each
 * MusicEvent's `performer` so a crawler reads the shows and the band as
 * one graph rather than as a MusicGroup and three unrelated events that
 * happen to share a name. Deliberately locale-independent — /de and /en
 * describe the same band, not two of them.
 */
export const BAND_ID = `${SITE_URL}/#band`;

/**
 * MusicGroup structured data for the band page.
 *
 * Every value is read from the existing content layer (content/band.ts,
 * content/social.ts, the message catalogues) rather than restated here,
 * so this cannot drift from what the page renders — the same rule
 * musicEventJsonLd follows for shows.
 */
export function musicGroupJsonLd(locale: AppLocale, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": BAND_ID,
    name: band.name,
    url: absoluteUrl(`/${locale}/band`),
    description,
    genre: ["Hardcore", "Metalcore"],
    foundingDate: String(band.foundedYear),
    foundingLocation: {
      "@type": "Place",
      name: band.city,
      address: {
        "@type": "PostalAddress",
        addressLocality: band.city,
        postalCode: band.postalCode,
        addressCountry: "DE",
      },
    },
    // The public profiles, straight from the same list the footer and
    // /media render — adding a platform there adds it here.
    sameAs: socials.map((social) => social.href),
    logo: absoluteUrl("/brand/wordmark.svg"),
    ...(band.groupPhoto && { image: absoluteUrl(band.groupPhoto) }),
    member: members.map((member) => ({
      "@type": "Person",
      name: member.displayName,
    })),
    email: band.contactEmail,
  };
}
