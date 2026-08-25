/**
 * Axis-aligned bounding box, in whatever logical coordinate space the
 * caller is simulating in — the same "fixed logical units, not device
 * pixels" space GameCanvas draws in.
 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Standard AABB overlap test, shared by every canvas game's collision
 * detection (Invaders' bullets-vs-invaders and bullets-vs-player,
 * Runner's player-vs-obstacle) so there's exactly one implementation to
 * get right.
 */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
