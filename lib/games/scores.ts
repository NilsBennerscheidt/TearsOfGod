/**
 * Every game that can record a highscore. The union is the single source
 * of truth for storage keys, so a typo in a game id is a type error
 * rather than a silently orphaned localStorage entry.
 *
 * The rhythm game isn't here yet — it's deferred pending a licensed
 * audio clip and isn't referenced anywhere in the arcade.
 */
export const GAME_IDS = ["whack", "invaders", "runner", "snake", "maze"] as const;
export type GameId = (typeof GAME_IDS)[number];

/**
 * Namespaced so a stray key from another tool on the same origin can
 * never be mistaken for ours, and so `tog:` can be cleared wholesale if
 * that's ever needed. Mirrored verbatim in the Datenschutz/Privacy
 * pages (section 5) — change one, change the other.
 */
const STORAGE_PREFIX = "tog:highscore:";

/**
 * `variant` scopes the key below the game itself — Snake's wall/speed
 * mode combinations, so a wraparound+fast run's best doesn't collide
 * with (or get unfairly compared against) a walls+slow one. Optional and
 * unused by the other four games; a colon separator matches the one
 * `tog:highscore:` already uses.
 */
export function highscoreStorageKey(game: GameId, variant?: string): string {
  return `${STORAGE_PREFIX}${game}${variant ? `:${variant}` : ""}`;
}

/**
 * Scores are bounded on write. Not an anti-cheat measure — the value
 * lives in the player's own browser and is theirs to edit — but it stops
 * a corrupted or hand-edited entry from rendering as `Infinity`, `NaN`,
 * or a 400-digit number that blows out the HUD layout.
 */
export const MAX_SCORE = 9_999_999;

export interface HighscoreRecord {
  /**
   * A literal, not a range: an entry written by a future schema fails
   * the check below and is treated as absent (see readHighscore), which
   * is the correct outcome — better to show "no best yet" than to render
   * a field this build doesn't understand.
   */
  readonly version: 1;
  readonly score: number;
  /** ISO 8601. */
  readonly achievedAt: string;
}

/**
 * Hand-written rather than a Zod schema, unlike every other validated
 * payload in this repo (lib/schemas/**).
 *
 * Those all run at build time on the server, where Zod costs nothing at
 * runtime. This one runs in the browser, and pulling Zod in to check two
 * fields measured +48 KB gzipped on the game chunk — roughly five times
 * the size of the game itself. The parsing contract is identical: unknown
 * in, a fully-typed record or null out, with every malformed shape
 * collapsing to null.
 *
 * If a future game stores something genuinely structured here, revisit
 * this — the trade only holds while the payload is this small.
 */
export function parseHighscoreRecord(value: unknown): HighscoreRecord | null {
  if (typeof value !== "object" || value === null) return null;

  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1) return null;

  const { score, achievedAt } = candidate;
  if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return null;
  }
  if (typeof achievedAt !== "string" || Number.isNaN(Date.parse(achievedAt))) return null;

  return { version: 1, score, achievedAt };
}

export function createHighscoreRecord(score: number): HighscoreRecord {
  return {
    version: 1,
    score: Math.max(0, Math.min(MAX_SCORE, Math.floor(score))),
    achievedAt: new Date().toISOString(),
  };
}

/**
 * Reads and validates one game's stored record.
 *
 * Every failure mode collapses to `null` on purpose: localStorage can
 * throw outright (Safari private browsing, storage disabled by policy,
 * quota), hold invalid JSON, or hold a well-formed object from an older
 * or newer schema. None of those is worth surfacing to a player who just
 * wants to whack a mole — the game simply behaves as if no best exists.
 */
export function readHighscore(game: GameId, variant?: string): HighscoreRecord | null {
  if (typeof window === "undefined") return null;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(highscoreStorageKey(game, variant));
  } catch {
    return null;
  }
  if (raw === null) return null;

  try {
    return parseHighscoreRecord(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Returns the record actually persisted, or `null` if the write failed.
 * A failed write is not an error the player needs to see either — the
 * score still shows for the rest of the session, it just won't survive a
 * reload.
 */
export function writeHighscore(game: GameId, score: number, variant?: string): HighscoreRecord | null {
  if (typeof window === "undefined") return null;

  const record = createHighscoreRecord(score);
  try {
    window.localStorage.setItem(highscoreStorageKey(game, variant), JSON.stringify(record));
    return record;
  } catch {
    return null;
  }
}
