import { cn } from "@/lib/cn";

interface MarqueeProps {
  items: readonly string[];
  className?: string;
}

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
 * The whole animated track repeats each slogan several times per half
 * purely for visual filling, so it's marked aria-hidden as a unit; a
 * single sr-only paragraph carries the real content once for assistive
 * tech instead of announcing it 2-6x over.
 */
export function Marquee({ items, className }: MarqueeProps) {
  const text = `${items.join(" · ")} · `;

  return (
    <div className={cn("tog-gold-sheen overflow-hidden bg-gold py-2.5 text-pitch", className)}>
      <p className="sr-only">{items.join(" · ")}</p>
      <div aria-hidden="true" className="flex animate-marquee motion-reduce:animate-none">
        {[0, 1].map((half) => (
          <div key={half} className="flex min-w-full shrink-0 justify-around">
            {[0, 1, 2].map((repeat) => (
              <span key={repeat} className="font-display px-2 text-sm tracking-wide whitespace-nowrap uppercase">
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
