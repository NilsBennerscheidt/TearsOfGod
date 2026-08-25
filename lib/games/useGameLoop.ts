"use client";

import { useEffect, useRef } from "react";

/**
 * Simulation step, in milliseconds. Fixed rather than "whatever dt the
 * last frame took": a variable step makes game behaviour depend on the
 * player's refresh rate (a 144Hz monitor would run a different game than
 * a 60Hz one), and makes any integration — gravity, difficulty ramps —
 * subtly non-deterministic. 60Hz is the safe common denominator.
 */
const FIXED_STEP_MS = 1000 / 60;

/**
 * Longest frame delta the accumulator will ever be fed. A tab that was
 * backgrounded, a device that slept, or a long GC pause can hand the
 * next rAF callback a multi-second delta; without this clamp the
 * catch-up loop below would try to run hundreds of steps in one frame
 * and lock the main thread — the classic "spiral of death".
 */
const MAX_FRAME_MS = 250;

/**
 * Belt-and-braces companion to the clamp: even a clamped 250ms delta is
 * 15 steps. If a frame ever needs the full budget the backlog is dropped
 * rather than carried, trading a barely-perceptible time skip for a
 * guaranteed-responsive main thread.
 */
const MAX_STEPS_PER_FRAME = 5;

export interface UseGameLoopOptions {
  /**
   * Called when the tab is hidden or the window loses focus. Games are
   * expected to move themselves to a paused state here — the loop does
   * not pause itself, because "paused" is game state the shell renders
   * an overlay for, not something a hook can decide on its own.
   *
   * Deliberately not paired with an auto-resume: silently resuming a
   * timed game the moment a player tabs back would cost them the
   * seconds they spent looking away.
   */
  onAutoPause?: () => void;
}

/**
 * Drives `update` at a fixed timestep while `running` is true.
 *
 * `update` and `onAutoPause` are held in refs and refreshed after every
 * render, so the effect below depends only on `running`. Passing a fresh
 * inline closure each render therefore does not tear down and restart
 * the loop, and the closure the loop calls is never stale — the two
 * failure modes a naive `[running, update]` dependency array picks one
 * of, whichever way you write it.
 *
 * Everything is torn down on unmount, which matters more here than in a
 * typical component: PageTransition keys the whole subtree on the
 * pathname (see components/layout/PageTransition.tsx), so navigating
 * away unmounts a running game mid-frame.
 */
export function useGameLoop(
  running: boolean,
  update: (stepSeconds: number) => void,
  options: UseGameLoopOptions = {},
): void {
  const updateRef = useRef(update);
  const autoPauseRef = useRef(options.onAutoPause);

  // No dependency array: refresh after every render, so the loop always
  // calls the latest closure. Assigning during render instead would be
  // unsafe under concurrent rendering, where a render can be discarded.
  useEffect(() => {
    updateRef.current = update;
    autoPauseRef.current = options.onAutoPause;
  });

  useEffect(() => {
    if (!running) return;

    let frame = 0;
    let last = performance.now();
    let accumulator = 0;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);

      const elapsed = Math.min(now - last, MAX_FRAME_MS);
      last = now;
      accumulator += elapsed;

      let steps = 0;
      while (accumulator >= FIXED_STEP_MS && steps < MAX_STEPS_PER_FRAME) {
        updateRef.current(FIXED_STEP_MS / 1000);
        accumulator -= FIXED_STEP_MS;
        steps += 1;
      }

      if (steps === MAX_STEPS_PER_FRAME) accumulator = 0;
    };

    frame = requestAnimationFrame(tick);

    // Two separate signals, both needed: `visibilitychange` covers
    // tab switches and screen lock but not a click onto another window
    // on the same screen, which only fires `blur`.
    const handleVisibility = () => {
      if (document.hidden) autoPauseRef.current?.();
    };
    const handleBlur = () => autoPauseRef.current?.();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [running]);
}
