/**
 * Fixed brand mottos — deliberately NOT translated. The source material's
 * own copy already mixes German and English within the same line ("WIR
 * FÜNF" inside otherwise-English marketing copy), which reads as an
 * intentional scene-authentic stylistic choice (DIY hardcore/punk flyers
 * commonly do this) rather than untranslated placeholder text. Treated
 * the same way a band name or album title wouldn't be translated.
 */
export const slogans = {
  /**
   * One entry, not the three identical copies this used to hold. The
   * ticker's visual density is the component's job (Marquee.tsx repeats
   * it to fill the track); repeating it in the data put the same
   * paragraph in the rendered HTML ~20 times, which is duplicate body
   * copy on the site's most important page.
   */
  marquee: [
    "Before the fateful night of the crescent siege, an unprecedented horror walked among all living. Merciless and cruel, it brought atrocities for eons unforgettable. The flaming dawn, throne of enmity, nightmare divine.",
  ],
  tourCreed: "ALL AGES · ALL PEOPLE · NO EXCUSES",
} as const;
