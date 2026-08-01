import { cn } from "@/lib/cn";

interface MarqueeProps {
  items: readonly string[];
  className?: string;
}

/**
 * A real scrolling ticker — the mockup's version was static (a single
 * overflowing line, clipped by overflow:hidden, no actual motion). Track
 * is duplicated for a seamless loop; motion-reduce: disables it.
 */
export function Marquee({ items, className }: MarqueeProps) {
  const text = `${items.join(" · ")} · `;

  return (
    <div className={cn("overflow-hidden bg-gold py-2.5 text-pitch", className)}>
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        <span className="font-display px-2 text-sm tracking-wide whitespace-nowrap uppercase">{text}</span>
        <span aria-hidden="true" className="font-display px-2 text-sm tracking-wide whitespace-nowrap uppercase">
          {text}
        </span>
      </div>
    </div>
  );
}
