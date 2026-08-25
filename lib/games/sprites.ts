"use client";

/**
 * Canvas asset helpers shared by every canvas-based game: mask-sprite
 * tinting and reading the brand palette's CSS custom properties into
 * fillStyle-ready strings.
 *
 * Nothing here runs at module scope — every function touches `document`
 * or `Image` only inside its own body. That matters because this module
 * is only ever imported from a game component mounted via next/dynamic's
 * `ssr: false` (see WhackMount/InvadersMount), so there is no SSR pass
 * for a module-scope DOM reference to break, but the functions stay
 * side-effect-free at import time regardless, on the same belt-and-
 * braces principle useGameLoop and input.ts already follow.
 */

const MASK_SRC = "/brand/mask.png";

let maskImagePromise: Promise<HTMLImageElement> | null = null;

/**
 * Loads the same 512×512 mask PNG that MaskGlyph applies as a CSS mask
 * everywhere else on the site (components/brand/MaskGlyph.tsx) — one
 * network request, already warm from the header logo on every page.
 * `decode()` resolves once the bitmap is actually paintable, so the
 * first canvas frame never draws a half-decoded image.
 */
function loadMaskImage(): Promise<HTMLImageElement> {
  if (maskImagePromise) return maskImagePromise;

  maskImagePromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.src = MASK_SRC;
    img
      .decode()
      .then(() => resolve(img))
      .catch(() => {
        // Older Safari can reject decode() on a cached image for reasons
        // unrelated to whether it actually loaded — fall back to the
        // plain load event rather than treating that as a real failure.
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("mask sprite failed to load"));
      });
  });

  return maskImagePromise;
}

const tintCache = new Map<string, Promise<HTMLCanvasElement | null>>();

/**
 * The mask sprite recolored to `color`, cached per color for the life of
 * the page.
 *
 * The source PNG's own pixel colors don't matter — same as MaskGlyph's
 * CSS mask usage, only its alpha channel is meaningful. `source-in`
 * keeps the drawn image's alpha and replaces its color with a flat fill:
 * the canvas equivalent of `mask-image` + `background`.
 *
 * Resolves to null on any failure (no 2D context, decode error) instead
 * of rejecting — callers fall back to a flat-color rect. Same "never let
 * an asset failure crash the game" contract useHighscore already follows
 * for a failed storage write.
 */
export function loadTintedMaskSprite(color: string): Promise<HTMLCanvasElement | null> {
  const cached = tintCache.get(color);
  if (cached) return cached;

  const promise = loadMaskImage()
    .then((img) => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return canvas;
    })
    .catch(() => null);

  tintCache.set(color, promise);
  return promise;
}

/**
 * Resolves one of app/globals.css's `@theme` color tokens to the string
 * the browser actually computed for it, for use as a canvas `fillStyle`
 * — a 2D context can't reference a CSS custom property the way an
 * element's own `style` attribute can. Reading it from the DOM instead
 * of hardcoding the same hex a second time here means canvas fills can't
 * silently drift from globals.css if the palette ever changes.
 */
export function readCssColor(cssVariable: string): string {
  if (typeof window === "undefined") return "#000000";
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVariable).trim();
  return value || "#000000";
}
