import type { ComponentProps } from "react";
import { MaskGlyph } from "@/components/brand/MaskGlyph";
import { Link } from "@/i18n/navigation";

/**
 * Derived from the i18n Link's own href prop rather than typed as
 * `string`. `typedRoutes: true` (next.config.ts) narrows that type to
 * the app's real route tree, so a card pointed at a route that doesn't
 * exist is a build error — the same guarantee NAV_ROUTES relies on.
 */
type AppHref = ComponentProps<typeof Link>["href"];

interface GameCardProps {
  title: string;
  tagline: string;
  /** Accent for the card's mask sigil — CSS color, e.g. "var(--color-gold)". */
  color?: string;
  /** Present for a playable game; omitted for a placeholder card. */
  href?: AppHref;
  /** Rendered in place of the play affordance when there's no href yet. */
  comingSoonLabel?: string;
  playLabel?: string;
}

/**
 * One tile on the arcade index.
 *
 * A card with no game behind it renders as a non-interactive <div>, not
 * a disabled link to a route that doesn't exist — same rule CtaButton
 * follows with `disabledLabel`: never fabricate an href to keep a
 * component's happy path. It also means the placeholder cards can't
 * break the typedRoutes check above.
 */
export function GameCard({
  title,
  tagline,
  color = "var(--color-gold)",
  href,
  comingSoonLabel,
  playLabel,
}: GameCardProps) {
  const body = (
    <>
      <div className="h-12 w-12 shrink-0">
        <MaskGlyph color={href ? color : "var(--color-steel)"} />
      </div>
      <div className="min-w-0">
        <h2 className="font-display text-xl leading-tight uppercase">{title}</h2>
        <p className="text-body text-steel-text mt-1">{tagline}</p>
        <p className="text-meta mt-3 font-mono tracking-wide uppercase">
          {href ? <span className="text-gold">{playLabel} →</span> : <span className="text-steel-text">{comingSoonLabel}</span>}
        </p>
      </div>
    </>
  );

  const shared = "flex gap-4 border border-ash bg-ink p-5";

  if (!href) {
    return (
      <div className={`${shared} opacity-60`} aria-disabled="true">
        {body}
      </div>
    );
  }

  return (
    <Link href={href} className={`${shared} tog-gold-cta text-bone hover:border-gold`}>
      {body}
    </Link>
  );
}
