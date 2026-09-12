import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

interface MarqueeProps {
  items: readonly string[];
  className?: string;
}

/**
 * Repeats needed to fill one half of the track. Nine is what the old
 * markup worked out to (three spans, each holding the slogan list three
 * times over) — kept as-is so the track keeps its width, and with it the
 * scroll speed, which is a function of track width against the fixed 22s
 * --animate-marquee.
 */
const REPEATS_PER_HALF = 9;

/**
 * A real scrolling ticker — the mockup's version was static (a single
 * overflowing line, clipped by overflow:hidden, no actual motion).
 *
 * The track is two identical halves, each forced to `min-w-full` so
 * neither half is ever narrower than the viewport. A naive "duplicate the
 * text once, translate -50%" loop only stays gapless when the doubled
 * text is at least viewport-wide — on any wider screen the second copy
 * runs out before the first one scrolls back in, and the loop visibly
 * stutters. Forcing full width per half, with each half animating its
 * own -100%, keeps the loop seamless regardless of viewport width or how
 * short the slogan list is. `justify-around` spreads the repeated items
 * across a stretched half instead of bunching them at one edge.
 * motion-reduce: disables the animation.
 *
 * The repeats exist purely to fill the track, so none of them is a text
 * node: the slogan is written once into a `--marquee-text` custom
 * property on the container, and each repeat renders it through
 * `.tog-marquee-item::before` (globals.css). Generated content is not in
 * the DOM, so the paragraph appears in the rendered HTML twice — once in
 * the sr-only line below, once in the style attribute — instead of the
 * ~20 copies the repeated text nodes used to produce. Same boxes, same
 * widths, same animation; a crawler just stops seeing the site's biggest
 * page as mostly one paragraph over and over.
 *
 * The whole animated track is aria-hidden as a unit; the sr-only
 * paragraph carries the real content once for assistive tech instead of
 * announcing it 2-6x over.
 */
export function Marquee({ items, className }: MarqueeProps) {
  // Trailing separator so the last repeat runs into the next one the same
  // way the items within a repeat do.
  const text = `${items.join(" · ")} · `;

  return (
    <div
      className={cn("tog-gold-sheen overflow-hidden bg-gold py-2.5 text-pitch", className)}
      // JSON.stringify, not bare quotes: `content` needs a CSS string, and
      // this escapes any quote or backslash a future slogan might contain
      // rather than silently breaking the declaration.
      style={{ "--marquee-text": JSON.stringify(text) } as CSSProperties}
    >
      <p className="sr-only">{items.join(" · ")}</p>
      <div aria-hidden="true" className="flex animate-marquee motion-reduce:animate-none">
        {[0, 1].map((half) => (
          <div key={half} className="flex min-w-full shrink-0 justify-around">
            {Array.from({ length: REPEATS_PER_HALF }, (_, repeat) => (
              <span
                key={repeat}
                className="tog-marquee-item font-display text-sm tracking-wide whitespace-nowrap uppercase"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
