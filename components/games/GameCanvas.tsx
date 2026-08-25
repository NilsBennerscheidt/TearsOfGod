"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

interface GameCanvasProps {
  /** The fixed simulation-space size games draw in, independent of the device's pixel density or the box's rendered CSS size. */
  logicalWidth: number;
  logicalHeight: number;
  className?: string;
  /**
   * Called synchronously on mount and after every DPR-aware resize —
   * whenever the canvas's backing store is (re)created. Store the ctx in
   * a ref and draw with it from the game loop; this callback itself must
   * never trigger a React re-render (see useGameLoop's doc comment on why
   * that matters for a 60Hz callback).
   */
  onContext: (ctx: CanvasRenderingContext2D | null) => void;
  /** Logical-space position of a held primary pointer (mouse-down or touch) while it's over the canvas. */
  onPointerActive?: (x: number, y: number) => void;
  /** The pointer was released, left the canvas, or was cancelled. */
  onPointerRelease?: () => void;
}

/**
 * DPR-aware canvas primitive shared by every canvas-based game.
 *
 * Games draw in a fixed logical coordinate space (e.g. 300×400 units)
 * regardless of device pixel density or the box's actual rendered size —
 * this component is the only place that translates between the two. The
 * wrapper's CSS `aspect-ratio` is locked to the logical space's own
 * ratio, so the scale factor computed below is always uniform; no
 * separate X/Y scale is ever needed.
 *
 * `onContext` rather than a plain forwarded ref: a `canvas.width` write
 * clears the canvas and invalidates any context acquired before it, so
 * every resize has to re-acquire the context and reset its transform —
 * "notify the caller a new one exists" is a callback's job.
 *
 * Also owns pointer→logical-space coordinate conversion (used for
 * touch/mouse steering) and applies `.tog-game-surface` (touch-action:
 * none, no tap highlight, no text selection — see globals.css) so every
 * canvas game gets safe touch behaviour without remembering to add it.
 */
export function GameCanvas({
  logicalWidth,
  logicalHeight,
  className,
  onContext,
  onPointerActive,
  onPointerRelease,
}: GameCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onContextRef = useRef(onContext);
  const onPointerActiveRef = useRef(onPointerActive);
  const onPointerReleaseRef = useRef(onPointerRelease);

  useEffect(() => {
    onContextRef.current = onContext;
    onPointerActiveRef.current = onPointerActive;
    onPointerReleaseRef.current = onPointerRelease;
  });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Capped, not raw devicePixelRatio: an uncapped 3x+ phone display
      // would make the backing store — and every fillRect on it — far
      // larger than the visible detail can actually use.
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width === width && canvas.height === height) return;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        onContextRef.current(null);
        return;
      }
      const scale = width / logicalWidth;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      onContextRef.current(ctx);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [logicalWidth, logicalHeight]);

  const toLogical = (clientX: number, clientY: number): [number, number] | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return [
      ((clientX - rect.left) / rect.width) * logicalWidth,
      ((clientY - rect.top) / rect.height) * logicalHeight,
    ];
  };

  return (
    <div
      ref={wrapperRef}
      className={cn("tog-game-surface relative", className)}
      style={{ aspectRatio: `${logicalWidth} / ${logicalHeight}` }}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        const point = toLogical(event.clientX, event.clientY);
        if (point) onPointerActiveRef.current?.(point[0], point[1]);
      }}
      onPointerMove={(event) => {
        // Ignore hover-without-press — a desktop mouse just passing over
        // the canvas shouldn't steer anything.
        if (event.buttons === 0) return;
        const point = toLogical(event.clientX, event.clientY);
        if (point) onPointerActiveRef.current?.(point[0], point[1]);
      }}
      onPointerUp={() => onPointerReleaseRef.current?.()}
      onPointerCancel={() => onPointerReleaseRef.current?.()}
      onPointerLeave={() => onPointerReleaseRef.current?.()}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
