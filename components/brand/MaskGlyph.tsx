interface MaskGlyphProps {
  color?: string;
  shiny?: boolean;
  className?: string;
}

/**
 * PLACEHOLDER — same situation as Wordmark: the source mockup's horned
 * mask sigil only ever existed as a raster PNG (mask.png), used there as
 * a CSS mask-image so it could be tinted per instance. No vector original
 * exists. This is a minimal abstract stand-in (a ring with two horn
 * strokes) rather than an attempt to fake the real illustration — swap
 * the <circle>/<path> below for the real traced artwork and every
 * consumer (MaskEmblem, LogoMonogram, TearHalo) updates automatically,
 * since they all render this one shape rather than each carrying their
 * own copy.
 */
export function MaskGlyph({ color = "currentColor", shiny = false, className }: MaskGlyphProps) {
  const stroke = shiny ? "url(#togGoldFoil)" : color;
  return (
    <svg viewBox="0 0 100 100" className={className} style={{ width: "100%", height: "100%" }}>
      <circle cx="50" cy="58" r="26" fill="none" stroke={stroke} strokeWidth="4" />
      <path d="M38,36 C30,24 26,14 22,8" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      <path d="M62,36 C70,24 74,14 78,8" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
