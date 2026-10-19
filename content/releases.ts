/** Proper nouns/facts about releases — not translated, same reasoning as content/band.ts. */
export interface Release {
  title: string;
  catalogNumber: string;
  year: number;
  /**
   * Where the hero's "listen" action points.
   *
   * NOTE: this is the Spotify *track* link that was supplied. I can't
   * verify from outside that this track is "Salt and Sweat" specifically
   * — if it's a different song, correct the URL here and the hero
   * follows automatically.
   */
  listenUrl?: string;
}

export const currentRelease: Release = {
  title: "Penumbra",
  catalogNumber: "TOG · Album · Nightmare Divine",
  year: 2026,
  listenUrl: "https://open.spotify.com/track/55PsAD53eMEgOesFTsjlHT?si=411a93aa495e4629",
};
