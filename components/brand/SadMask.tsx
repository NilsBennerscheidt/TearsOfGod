import { cn } from "@/lib/cn";
import { MASK_EYES } from "./mask-geometry";
import { MaskGlyph } from "./MaskGlyph";

interface SadMaskProps {
  size?: number;
  /** Accessible name. Omit when decorative — see MaskEmblem. */
  title?: string;
  className?: string;
}

/**
 * The mask, crying — the 404 page's mark.
 *
 * "Sad" out of a fixed piece of artwork has to come from staging, not
 * from the glyph: the mask is a single flat silhouette (see MaskGlyph's
 * KNOWN GAP note) with no features to redraw into a frown. Three cues do
 * the work instead — a head-tilt, a drained-of-gold color, and tears —
 * and only the tears need the artwork's real geometry, which is why the
 * eye coordinates are shared via mask-geometry rather than eyeballed
 * here.
 *
 * Deliberately not MaskEmblem's `ring`, and not TearHalo: both frame the
 * mask in ceremony, which is the opposite of the read here. This one is
 * meant to look small and unwell.
 */
export function SadMask({ size = 132, title, className }: SadMaskProps) {
  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
      {...(title
        ? { role: "img", "aria-label": title }
        : { "aria-hidden": true })}
    >
      {/* The tilt lives on an inner wrapper so the tears below fall
          straight down (gravity doesn't tilt with the head) rather than
          drifting sideways at 7°. */}
      <div className="h-full w-full -rotate-[7deg]">
        <MaskGlyph color="var(--color-steel)" />
      </div>
      {MASK_EYES.map((eye, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="tog-tear pointer-events-none absolute"
          // Staggered so the two eyes drip out of step — in sync they
          // read as a mechanism, alternating they read as crying.
          style={{
            left: eye.left,
            top: eye.top,
            animationDelay: i === 0 ? "0s" : "1.6s",
          }}
        >
          <svg
            viewBox="0 0 10 14"
            width={size * 0.075}
            height={size * 0.105}
            aria-hidden="true"
          >
            <path
              d="M5 0.5 C5 5 9.5 7.4 9.5 9.6 A4.5 4.5 0 0 1 0.5 9.6 C0.5 7.4 5 5 5 0.5 Z"
              fill="var(--color-gold)"
              opacity="0.85"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}
