"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameCanvas } from "@/components/games/GameCanvas";
import { GameOverCard } from "@/components/games/GameOverCard";
import { GameShell, Overlay, type GameStatus } from "@/components/games/GameShell";
import { useHeldDirection } from "@/lib/games/input";
import { INITIAL_LIVES, InvadersEngine, LOGICAL_HEIGHT, LOGICAL_WIDTH } from "@/lib/games/invaders/engine";
import { drawInvaders, type InvadersSprites } from "@/lib/games/invaders/render";
import { loadTintedMaskSprite, readCssColor } from "@/lib/games/sprites";
import { useGameLoop } from "@/lib/games/useGameLoop";
import { useHighscore } from "@/lib/games/useHighscore";

/** The subset of the engine's snapshot the HUD actually needs — updated only when the engine reports it changed (see engine.ts), not every frame the way drawing is. */
interface Hud {
  score: number;
  lives: number;
  waveClearActive: boolean;
}

const IDLE_HUD: Hud = { score: 0, lives: INITIAL_LIVES, waveClearActive: false };

/** Placeholder colors until readCssColor resolves the real theme tokens on mount — close enough in hue that a first paint before that effect runs isn't jarring, never actually seen in practice. */
const FALLBACK_SPRITES: InvadersSprites = {
  gold: null,
  blood: null,
  bone: null,
  colors: { gold: "#d9b25a", bloodText: "#e0483f", bone: "#f1ece0" },
};

/**
 * Mask Invasion — Space Invaders, played with a fixed 6×4 formation of
 * masks and the front row worth more than the rest.
 *
 * Canvas rather than DOM: unlike Whack's nine static holes, this has
 * dozens of continuously-moving entities (invaders, two bullet streams)
 * — exactly the case the earlier investigation called out as canvas's
 * strength over DOM. GameCanvas and lib/games/sprites.ts, both new in
 * this game, are the shared canvas plumbing the Runner will reuse.
 *
 * Controls are deliberately single-axis: arrow keys / A-D, or drag
 * anywhere on the canvas, move the ship left and right; firing is
 * automatic. A manual fire button would be one more thing to hit on a
 * phone screen for a game that's really about dodging, not aiming.
 */
export function InvadersGame() {
  const t = useTranslations("Games");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [hud, setHud] = useState<Hud>(IDLE_HUD);
  const [isNewBest, setIsNewBest] = useState(false);
  const { best, submit } = useHighscore("invaders");

  const engineRef = useRef<InvadersEngine | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const spritesRef = useRef<InvadersSprites>(FALLBACK_SPRITES);
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const keyboardDirRef = useHeldDirection(status === "playing");
  const pointerTargetRef = useRef<number | null>(null);

  // Sprites load once, independent of `status` — the promises are
  // cached (see lib/games/sprites.ts), so starting before this resolves
  // costs nothing extra; drawInvaders falls back to flat fills for
  // whichever variant isn't ready yet.
  useEffect(() => {
    const colors = {
      gold: readCssColor("--color-gold"),
      bloodText: readCssColor("--color-blood-text"),
      bone: readCssColor("--color-bone"),
    };
    spritesRef.current = { ...spritesRef.current, colors };
    loadTintedMaskSprite(colors.gold).then((sprite) => {
      spritesRef.current = { ...spritesRef.current, gold: sprite };
    });
    loadTintedMaskSprite(colors.bloodText).then((sprite) => {
      spritesRef.current = { ...spritesRef.current, blood: sprite };
    });
    loadTintedMaskSprite(colors.bone).then((sprite) => {
      spritesRef.current = { ...spritesRef.current, bone: sprite };
    });
  }, []);

  const step = useCallback(
    (deltaSeconds: number) => {
      const engine = engineRef.current;
      if (engine === null) return;

      engine.setDirection(keyboardDirRef.current);
      engine.setTargetX(pointerTargetRef.current);

      const hudChanged = engine.step(deltaSeconds);
      const snapshot = engine.snapshot();

      const ctx = ctxRef.current;
      if (ctx !== null) drawInvaders(ctx, snapshot, spritesRef.current);

      if (hudChanged) {
        setHud({ score: snapshot.score, lives: snapshot.lives, waveClearActive: snapshot.waveClearActive });
      }

      if (snapshot.finished) {
        setStatus("over");
        setIsNewBest(submit(snapshot.score));
      }
    },
    [keyboardDirRef, submit],
  );

  const handleAutoPause = useCallback(() => {
    setStatus((current) => (current === "playing" ? "paused" : current));
  }, []);

  useGameLoop(status === "playing", step, { onAutoPause: handleAutoPause });

  const handleStart = useCallback(() => {
    const engine = new InvadersEngine();
    engineRef.current = engine;
    pointerTargetRef.current = null;
    const snapshot = engine.snapshot();
    setHud({ score: snapshot.score, lives: snapshot.lives, waveClearActive: snapshot.waveClearActive });
    setIsNewBest(false);
    setStatus("playing");
  }, []);

  return (
    <GameShell
      eyebrow={t("invaders.eyebrow")}
      title={t("invaders.title")}
      instructions={t("invaders.instructions")}
      status={status}
      score={hud.score}
      best={best}
      extraLabel={t("livesLabel")}
      extraValue={String(hud.lives)}
      onStart={handleStart}
      onResume={() => setStatus("playing")}
      onPause={() => setStatus("paused")}
      gameOver={<GameOverCard score={hud.score} best={best} isNewBest={isNewBest} onRestart={handleStart} />}
    >
      <GameCanvas
        logicalWidth={LOGICAL_WIDTH}
        logicalHeight={LOGICAL_HEIGHT}
        className="mx-auto h-full max-w-full border border-ash bg-pitch"
        onContext={(ctx) => {
          ctxRef.current = ctx;
        }}
        onPointerActive={(x) => {
          // Steering only applies once a round is actually running —
          // a drag on the idle overlay's instructions text shouldn't
          // move a ship that isn't in play yet.
          if (statusRef.current === "playing") pointerTargetRef.current = x;
        }}
        onPointerRelease={() => {
          pointerTargetRef.current = null;
        }}
      />

      {status === "playing" && hud.waveClearActive && (
        <Overlay className="bg-pitch/70">
          <p className="font-display text-2xl text-gold uppercase">{t("invaders.waveClear")}</p>
        </Overlay>
      )}
    </GameShell>
  );
}
