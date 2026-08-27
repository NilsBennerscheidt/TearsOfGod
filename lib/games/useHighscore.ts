"use client";

import { useCallback, useSyncExternalStore } from "react";
import { type GameId, highscoreStorageKey, readHighscore, writeHighscore } from "./scores";

/**
 * Parsed scores, cached per storage key — not per GameId, since Snake's
 * mode variants (see the `variant` param below) each need independent
 * cache/subscriber state despite sharing a GameId.
 *
 * useSyncExternalStore requires getSnapshot to return a referentially
 * stable value between actual changes — re-reading and re-parsing
 * localStorage on every render would return a fresh value each time and
 * spin React in a re-render loop. The cache is dropped on every write
 * and on every cross-tab storage event, which are the only two ways the
 * underlying value can change.
 */
const scoreCache = new Map<string, number>();
const listeners = new Map<string, Set<() => void>>();

function invalidate(key: string): void {
  scoreCache.delete(key);
  for (const listener of listeners.get(key) ?? []) listener();
}

function getSnapshot(key: string, game: GameId, variant: string | undefined): number {
  const cached = scoreCache.get(key);
  if (cached !== undefined) return cached;

  const value = readHighscore(game, variant)?.score ?? 0;
  scoreCache.set(key, value);
  return value;
}

/**
 * null, not 0 — "not read yet" is a different statement from "your best
 * is zero", and the HUD renders a dash for it rather than a number that
 * would flip on hydration.
 */
function getServerSnapshot(): null {
  return null;
}

export interface UseHighscoreResult {
  /** The stored best, or null before the store has been read (server render only in practice). */
  best: number | null;
  /** False only while `best` is still null. */
  ready: boolean;
  /** Persists `score` if it beats the stored best. Returns true when it did. */
  submit: (score: number) => boolean;
}

/**
 * localStorage-backed personal best for one game, optionally scoped to a
 * `variant` (Snake's wall/speed mode combinations — see
 * lib/games/scores.ts's `highscoreStorageKey`; the other four games call
 * this with no variant, same as before this existed).
 *
 * Built on useSyncExternalStore rather than useState-plus-an-effect.
 * localStorage is an external store that does not exist during SSR, and
 * this is the hook React provides for exactly that shape — it handles
 * the server/client snapshot split itself, so there is no
 * setState-in-an-effect and no cascading render on mount.
 *
 * The `storage` event subscription is a real benefit, not incidental: a
 * player with the game open in two tabs sees one best score, not two
 * that disagree. That event only fires in the *other* tabs, which is why
 * submit() also invalidates locally.
 */
export function useHighscore(game: GameId, variant?: string): UseHighscoreResult {
  const key = highscoreStorageKey(game, variant);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      let set = listeners.get(key);
      if (set === undefined) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(onStoreChange);

      // key === null means the whole store was cleared (e.g. the player
      // wiped site data from another tab) — that affects us too.
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === key) invalidate(key);
      };
      window.addEventListener("storage", onStorage);

      return () => {
        set.delete(onStoreChange);
        if (set.size === 0) listeners.delete(key);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );

  const best = useSyncExternalStore(subscribe, () => getSnapshot(key, game, variant), getServerSnapshot);

  const submit = useCallback(
    (score: number): boolean => {
      // Read through the cache rather than trusting `best` from the
      // closure: storage is the source of truth, and another tab may
      // have written a higher score since this render.
      const stored = getSnapshot(key, game, variant);
      if (score <= stored) return false;

      const written = writeHighscore(game, score, variant);
      if (written === null) {
        // The write failed (storage disabled, private mode, quota). Show
        // the new best for this session anyway — it is true, it just
        // won't survive a reload. Telling the player they hadn't beaten
        // a score they just beat would be the worse lie.
        scoreCache.set(key, score);
        for (const listener of listeners.get(key) ?? []) listener();
      } else {
        invalidate(key);
      }
      return true;
    },
    [key, game, variant],
  );

  return { best, ready: best !== null, submit };
}
