/** Proper nouns/facts about releases — not translated, same reasoning as content/band.ts. */
export interface Release {
  title: string;
  catalogNumber: string;
  year: number;
}

export const currentRelease: Release = {
  title: "Salt and Sweat",
  catalogNumber: "TOG · EP · 001",
  year: 2026,
};
