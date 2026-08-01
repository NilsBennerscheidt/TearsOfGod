interface WordmarkProps {
  /** Any valid CSS color, or "currentColor" (the default) to inherit from a parent. Ignored when shiny is true. */
  color?: string;
  /** Fills with the animated gold-foil gradient instead of a flat color, matching MaskEmblem/LogoMonogram's shiny prop. */
  shiny?: boolean;
  width?: number;
  className?: string;
  /** Accessible name. The wordmark reads "Tears of God" even though the glyphs below are a text placeholder, not the real logotype. */
  title?: string;
}

/**
 * PLACEHOLDER — no vector original exists yet (only a 237KB raster PNG was
 * shipped in the source mockup, used there as a CSS mask so it could be
 * tinted). This renders the wordmark as set type in the brand's own
 * "BB · HEADLINE" voice (Archivo Black) instead, at the real logotype's
 * 806:540 aspect ratio, so every call site already has the right shape
 * and API. Swap the <text> node below for real traced <path> data and
 * nothing outside this file needs to change.
 */
export function Wordmark({
  color = "currentColor",
  shiny = false,
  width = 240,
  className,
  title = "Tears of God",
}: WordmarkProps) {
  return (
    <svg
      viewBox="0 0 806 540"
      width={width}
      height={(width * 540) / 806}
      role="img"
      aria-label={title}
      className={className}
    >
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={shiny ? "url(#togGoldFoil)" : color}
        fontFamily="'Archivo Black', sans-serif"
        fontSize="110"
        letterSpacing="-0.02em"
      >
        TEARS
        <tspan x="50%" dy="1em">
          OF GOD
        </tspan>
      </text>
    </svg>
  );
}
