/**
 * Deterministic PRNG (xmur3-style string hash seeding mulberry32) so the
 * same seed always produces the same sequence — used where the original
 * mockup called Math.random() directly (e.g. Barcode), which would
 * hydration-mismatch under SSR since server and client would each roll
 * their own random bars.
 */
function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function seededRandom(seed: string): () => number {
  let a = hashSeed(seed);
  return function mulberry32() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
