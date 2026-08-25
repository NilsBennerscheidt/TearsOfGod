import {
  BULLET_H,
  BULLET_W,
  INVADER_H,
  INVADER_W,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  PLAYER_H,
  PLAYER_W,
  PLAYER_Y,
  type InvadersSnapshot,
} from "./engine";

export interface InvadersSprites {
  gold: HTMLCanvasElement | null;
  blood: HTMLCanvasElement | null;
  bone: HTMLCanvasElement | null;
  /** Resolved from app/globals.css's @theme tokens once at load time — see readCssColor in lib/games/sprites.ts. Used whenever a sprite hasn't finished loading yet. */
  colors: {
    gold: string;
    bloodText: string;
    bone: string;
  };
}

/**
 * Paints one frame. Pure and side-effect-free beyond the draw calls
 * themselves — no game state lives here, only the mapping from a
 * snapshot to pixels, called unconditionally every frame from the
 * component's game-loop callback (see engine.ts's doc comment on why
 * this isn't gated the way Whack's DOM updates are).
 */
export function drawInvaders(ctx: CanvasRenderingContext2D, snapshot: InvadersSnapshot, sprites: InvadersSprites): void {
  ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  for (const invader of snapshot.invaders) {
    const sprite = invader.variant === "blood" ? sprites.blood : sprites.gold;
    if (sprite) {
      ctx.drawImage(sprite, invader.x, invader.y, INVADER_W, INVADER_H);
    } else {
      ctx.fillStyle = invader.variant === "blood" ? sprites.colors.bloodText : sprites.colors.gold;
      ctx.fillRect(invader.x, invader.y, INVADER_W, INVADER_H);
    }
  }

  ctx.fillStyle = sprites.colors.gold;
  for (const bullet of snapshot.playerBullets) ctx.fillRect(bullet.x, bullet.y, BULLET_W, BULLET_H);

  ctx.fillStyle = sprites.colors.bloodText;
  for (const bullet of snapshot.enemyBullets) ctx.fillRect(bullet.x, bullet.y, BULLET_W, BULLET_H);

  // Blinks during invulnerability rather than vanishing — a ship that
  // disappears reads as "did I lose it", not "I'm briefly safe".
  const playerVisible = !snapshot.playerInvulnerable || Math.floor(performance.now() / 90) % 2 === 0;
  if (playerVisible) {
    if (sprites.bone) {
      ctx.drawImage(sprites.bone, snapshot.playerX, PLAYER_Y, PLAYER_W, PLAYER_H);
    } else {
      ctx.fillStyle = sprites.colors.bone;
      ctx.fillRect(snapshot.playerX, PLAYER_Y, PLAYER_W, PLAYER_H);
    }
  }
}
