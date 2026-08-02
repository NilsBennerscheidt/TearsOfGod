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
    legalName: "Tears of God",
    streetAddress: "Bochumer Str. 7",
  },
  contactEmail: "booking@tearsofgod.net",
  /**
   * Points into public/media/photos/ rather than public/band/ — it's the
   * same 2025-01-05 studio shoot already used on the /media gallery, and
   * these are multi-MB originals, so reusing the one file avoids shipping
   * a duplicate copy under a second path. Omit to fall back to
   * PhotoPlaceholder on the /band page.
   */
  groupPhoto: "/media/photos/2025-01-05_-_Tears_of_God_Bandfotos_0002.jpg" as string | undefined,
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
  /**
   * Lookup key into `Band.members.<key>.bio` in the message catalogues —
   * a separate field from `displayName` so the message key stays stable
   * even if a stage name changes, and lowercase/ASCII regardless of how
   * `displayName` is styled.
   */
  key: string;
  /**
   * Path under public/media/photos/ — see the note on `band.groupPhoto`
   * above for why these live there instead of public/band/. Omit to fall
   * back to PhotoPlaceholder on both the landing page's MemberGrid strip
   * and the /band page's MemberCards.
   */
  photo?: string;
}

const BANDFOTOS = "/media/photos/2025-01-05_-_Tears_of_God_Bandfotos";

export const members: Member[] = [
  { name: "Mirko", displayName: "Murk", role: "vocals", key: "murk", photo: `${BANDFOTOS}_Murk.jpg` },
  { name: "Danijal", displayName: "DANJI", role: "leadGuitar", key: "danji", photo: `${BANDFOTOS}_Danji.jpg` },
  // Source file is misspelled "Nols" — matches the Jan 5 shoot's other
  // four member portraits by naming pattern, not a different photo.
  { name: "Nils", displayName: "NILS", role: "bass", key: "nils", photo: `${BANDFOTOS}_Nols.jpg` },
  { name: "Lars", displayName: "LARS", role: "drums", key: "lars", photo: `${BANDFOTOS}_Lars.jpg` },
  { name: "Gerrit", displayName: "GARY", role: "rhythmGuitar", key: "gary", photo: `${BANDFOTOS}_Gary.jpg` },
];
