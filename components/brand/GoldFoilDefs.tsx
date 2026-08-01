/**
 * Shared gold-foil SVG gradients, rendered exactly once in the root
 * layout. Any brand primitive that wants a "shiny" gold fill/stroke
 * references these by id — `fill="url(#togGoldFoil)"` (horizontal) or
 * `fill="url(#togGoldFoilV)"` (vertical) — instead of each component
 * carrying its own copy.
 *
 * The source mockup animated togGoldFoil's middle stop via SVG SMIL
 * (<animate>), with no reduced-motion guard. SMIL animations aren't
 * reachable by a CSS `prefers-reduced-motion` media query, so rather than
 * ship an always-on animation with no accessible way to turn it off,
 * these are static gradients — still a gold-foil sweep, just not in
 * motion. The animated shimmer lives on the CSS-only `.tog-gold-text` /
 * `.tog-gold-foil` classes instead (globals.css), which a standard media
 * query *can* gate.
 */
export function GoldFoilDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="togGoldFoil" x1="0%" y1="0%" x2="100%" y2="100%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#6e4815" />
          <stop offset="18%" stopColor="#a87a26" />
          <stop offset="38%" stopColor="#f5dc7e" />
          <stop offset="50%" stopColor="#fff4c0" />
          <stop offset="62%" stopColor="#f5dc7e" />
          <stop offset="82%" stopColor="#a87a26" />
          <stop offset="100%" stopColor="#6e4815" />
        </linearGradient>
        <linearGradient id="togGoldFoilV" x1="0%" y1="0%" x2="0%" y2="100%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#f5dc7e" />
          <stop offset="22%" stopColor="#d9b25a" />
          <stop offset="45%" stopColor="#a87a26" />
          <stop offset="68%" stopColor="#d9b25a" />
          <stop offset="88%" stopColor="#f5dc7e" />
          <stop offset="100%" stopColor="#a87a26" />
        </linearGradient>
      </defs>
    </svg>
  );
}
