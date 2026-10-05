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
  contactEmail: "info@tearsofgod.net",
  /**
   * Points into public/media/photos/ rather than public/band/ — it's the
   * same 2025-01-05 studio shoot already used on the /media gallery, and
   * these are multi-MB originals, so reusing the one file avoids shipping
   * a duplicate copy under a second path. Omit to fall back to
   * PhotoPlaceholder on the /band page.
   */
  groupPhoto: "/media/photos/2026-09-18-tears-of-god-portrait-shooting-0016.jpg" as string | undefined,
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
  /**
   * Stage/display form, written the way the member does — the UI
   * uppercases it in CSS. Stored title-case rather than already-shouting
   * so it can also be read back as plain prose, e.g. in the image alt
   * text ("Nils, Bassist von Tears of God", not "NILS, …").
   */
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
   * above for why these live there instead of public/band/. Omit to fall‚
   * back to PhotoPlaceholder on both the landing page's MemberGrid strip
   * and the /band page's MemberCards.
   */
  photo?: string;
}

const BANDFOTOS = "/media/photos/2025-01-05_-_Tears_of_God_Bandfotos";

export const members: Member[] = [
  { name: "Mirko", displayName: "Murk", role: "vocals", key: "murk", photo: "/media/photos/2026-09-18_-_Tears_of_God_Portrait-Shooting_0001.jpg" },
  { name: "Danijal", displayName: "Danji", role: "leadGuitar", key: "danji", photo: "/media/photos/2026-09-18_-_Tears_of_God_Portrait-Shooting_0008.jpg" },
  { name: "Nils", displayName: "Nils", role: "bass", key: "nils", photo: "/media/photos/2026-09-18_-_Tears_of_God_Portrait-Shooting_0007.jpg" },
  { name: "Lars", displayName: "Lars", role: "drums", key: "lars", photo: "/media/photos/2026-09-18_-_Tears_of_God_Portrait-Shooting_0006.jpg" }
];