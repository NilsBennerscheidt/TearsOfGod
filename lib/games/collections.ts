/**
 * Typed array access for game code.
 *
 * The project compiles with `noUncheckedIndexedAccess` (tsconfig.json),
 * so `holes[i]` is `Hole | undefined` everywhere. Game loops index
 * arrays constantly, and the tempting fix — a `!` on every lookup — is
 * exactly the assertion that turns a real off-by-one into an undefined
 * property access three frames later instead of a clear error at the
 * point of the bug. These helpers make the two honest options explicit:
 * handle the miss, or fail loudly with the context to debug it.
 */

/** Explicit "this may be out of range, and I will handle that." */
export function at<T>(items: readonly T[], index: number): T | undefined {
  return items[index];
}

/**
 * For lookups the surrounding code has already made safe (an index
 * derived from the array's own length, a value picked from the array a
 * line earlier). Throws with a locating message instead of returning
 * undefined, so a broken invariant surfaces where it broke.
 */
export function requireAt<T>(items: readonly T[], index: number, context: string): T {
  const value = items[index];
  if (value === undefined) {
    throw new Error(`${context}: index ${index} out of range (length ${items.length})`);
  }
  return value;
}

/**
 * Uniform pick from a non-empty array, or undefined for an empty one.
 * Takes the random source as an argument so a caller that needs
 * determinism can pass lib/seededRandom's generator instead of
 * Math.random — see the note in the whack-a-mole engine on why that one
 * deliberately does not.
 */
export function pickRandom<T>(items: readonly T[], random: () => number = Math.random): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(random() * items.length)];
}
