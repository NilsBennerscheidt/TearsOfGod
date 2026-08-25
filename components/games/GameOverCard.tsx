"use client";

import { useTranslations } from "next-intl";
import { Stamp } from "@/components/brand/Stamp";
import { Link } from "@/i18n/navigation";
import { Overlay, OverlayButton } from "./GameShell";

interface GameOverCardProps {
  score: number;
  best: number | null;
  isNewBest: boolean;
  onRestart: () => void;
}

/**
 * End-of-round overlay: final score, a stamped mark when it beat the
 * stored best, and the two things a player wants next — go again, or go
 * back to the arcade.
 *
 * No focus trap, deliberately. lib/focus-trap.ts marks #main-content
 * `inert` while it's active, which is right for PhotoLightbox (portaled
 * to document.body, outside main) and exactly wrong here — this overlay
 * renders inside #main-content and would inert itself. What's actually
 * needed is narrower anyway: move focus off the now-dead mole buttons
 * and onto the retry action, which `autoFocus` does.
 *
 * The score is announced once, here, via role="status" — the running HUD
 * score deliberately isn't a live region (see Scoreboard).
 */
export function GameOverCard({ score, best, isNewBest, onRestart }: GameOverCardProps) {
  const t = useTranslations("Games");

  return (
    <Overlay>
      <p className="font-display text-3xl text-gold uppercase">{t("gameOver")}</p>

      <div role="status">
        <p className="text-meta text-steel-text font-mono tracking-widest uppercase">{t("finalScore")}</p>
        <p className="font-brutal mt-1 text-5xl leading-none text-bone tabular-nums">
          {score.toLocaleString("de-DE")}
        </p>
      </div>

      {isNewBest ? (
        // color override per Stamp's own doc comment — its default
        // --color-blood is only AA-readable on light surfaces.
        <Stamp color="var(--color-blood-text)">{t("newBest")}</Stamp>
      ) : (
        best !== null && (
          <p className="text-meta text-steel-text font-mono tracking-wide uppercase">
            {t("bestLabel")} · {best.toLocaleString("de-DE")}
          </p>
        )
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <OverlayButton onClick={onRestart} autoFocus>
          {t("restart")}
        </OverlayButton>
        <Link
          href="/games"
          className="font-display inline-flex min-h-11 items-center border border-bone px-5 py-2.5 text-xs tracking-wide text-bone uppercase hover:border-gold hover:text-gold"
        >
          {t("backToArcade")}
        </Link>
      </div>
    </Overlay>
  );
}
