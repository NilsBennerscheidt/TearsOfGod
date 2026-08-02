/**
 * Press kit — a single downloadable ZIP plus the manifest of what's
 * inside it, so the page can list contents without unzipping anything at
 * build time. `href` assumes the file lives at public/presskit/, i.e. is
 * served from /presskit/<filename> — drop the actual ZIP there.
 *
 * `contentsKeys` are message keys under Press.contents.* in the message
 * catalogues, not literal strings — same reasoning as MemberRole in
 * content/band.ts: a closed, translated set rather than free text.
 */
export interface PressKit {
  href: string;
  /** ISO date (YYYY-MM-DD) the ZIP was last rebuilt — shown next to the download link. */
  lastUpdated: string;
  contentsKeys: Array<"logos" | "photos" | "bio" | "techRider">;
}

export const pressKit: PressKit = {
  href: "/presskit/tears-of-god-presskit.zip",
  lastUpdated: "2026-08-02",
  contentsKeys: ["logos", "photos", "bio", "techRider"],
};
