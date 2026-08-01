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
  contactEmail: "booking@tearsofgod.net",
} as const;

/**
 * Instrument roles are a closed set of stable keys, not display strings —
 * they resolve through `Band.roles.*` in the message catalogues because
 * they genuinely translate (Drums → Schlagzeug). Adding a member with a
 * role not listed here is a compile error rather than a missing
 * translation discovered in production.
 */
export type MemberRole = "vocals" | "leadGuitar" | "rhythmGuitar" | "bass" | "drums";

export interface Member {
  /** Given name. */
  name: string;
  /** Stage/display form, rendered uppercase by the UI. */
  displayName: string;
  role: MemberRole;
}

export const members: Member[] = [
  { name: "Mirko", displayName: "Murk", role: "vocals" },
  { name: "Danijal", displayName: "DANJI", role: "leadGuitar" },
  { name: "Nils", displayName: "NILS", role: "bass" },
  { name: "Lars", displayName: "LARS", role: "drums" },
  { name: "Gerrit", displayName: "GARY", role: "rhythmGuitar" },
];
