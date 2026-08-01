/**
 * Structural facts about the band — proper nouns and addresses, not
 * prose. Never translated (same reasoning as show venue/city in
 * lib/schemas/show.ts): a name or a street address doesn't change
 * meaning between languages. Page copy (headlines, bio text) lives in
 * next-intl messages instead.
 */
export const band = {
  name: "Tears of God",
  foundedYear: 2024, // "EST. MMXXIV"
  city: "Castrop-Rauxel",
  postalCode: "44575",
  coordinates: { lat: 51.5497, lng: 7.3121 },
  entity: {
    legalName: "Tears of God GbR",
    streetAddress: "Bochumer Str. 7",
  },
  contactEmail: "jonas@tearsofgod.band",
} as const;

export interface Member {
  /** Full name — only documented for Jonas (business card / letterhead). Others are first-name-only in every source artboard; inventing surnames or instruments for them isn't this codebase's call to make. */
  name: string;
  /** Uppercase display form, as used throughout the brand system. */
  displayName: string;
  /** Message key under the Band.* namespace for this member's role — only set where the role is real, documented data. Only Jonas's is (business card: "VOCALS · BOOKING"). */
  roleKey?: "jonasRole";
}

export const members: Member[] = [
  { name: "Jonas Krämer", displayName: "JONAS", roleKey: "jonasRole" },
  { name: "Max", displayName: "MAX" },
  { name: "Lena", displayName: "LENA" },
  { name: "Tim", displayName: "TIM" },
  { name: "Paul", displayName: "PAUL" },
];
