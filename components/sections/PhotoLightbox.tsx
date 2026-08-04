"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFocusTrap } from "@/lib/focus-trap";
import type { MediaPhoto } from "@/types/content";

interface PhotoLightboxProps {
  photos: MediaPhoto[];
  /** Index into `photos`, or null when closed — a discriminated "is it open" instead of a separate boolean that could disagree with the index. */
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/** Minimum horizontal drag, in px, before a touch/pointer gesture counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 50;

/**
 * Full-viewport photo overlay opened from PhotoGrid. Reuses the same
 * focus-trap hook as MobileNavToggle (lib/focus-trap.ts) for the
 * open/close lifecycle, and layers its own Escape/arrow-key handling and
 * swipe gesture on top for gallery navigation specifically.
 *
 * Renders through next/image at `sizes="100vw"`, not a bare `<img src>` —
 * the source files are up to 8192px/several MB; serving them unoptimized
 * here would make the lightbox slower to open than the grid it opened
 * from.
 *
 * Portaled to `document.body` rather than rendered in place: PhotoGrid
 * (its only caller) renders inside `#main-content`, and useFocusTrap
 * marks `#main-content` `inert` while this is open so a screen reader's
 * virtual cursor can't wander into the grid behind it — that would inert
 * this dialog too if it stayed nested inside. `fixed inset-0` doesn't
 * depend on any ancestor's positioning, so the portal changes nothing
 * visually.
 */
export function PhotoLightbox({ photos, index, onClose, onNavigate }: PhotoLightboxProps) {
  const t = useTranslations("Media");
  const isOpen = index !== null;
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // `loaded` is derived by comparing against the index it loaded for,
  // rather than a plain boolean reset in an effect — the moment `index`
  // changes this stops matching on its own, so the loader reappears for
  // a photo that hasn't decoded yet without an extra render pass.
  const [loadedIndex, setLoadedIndex] = useState<number | null>(null);
  const loaded = loadedIndex === index;

  useFocusTrap(isOpen, containerRef, onClose);

  useEffect(() => {
    if (!isOpen || index === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") onNavigate((index! - 1 + photos.length) % photos.length);
      else if (e.key === "ArrowRight") onNavigate((index! + 1) % photos.length);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, index, photos.length, onNavigate]);

  const photo = index === null ? undefined : photos[index];
  if (index === null || !photo) return null;

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    touchStartX.current = e.clientX;
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (touchStartX.current === null || index === null) return;
    const delta = e.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    onNavigate(delta > 0 ? (index - 1 + photos.length) % photos.length : (index + 1) % photos.length);
  }

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
      className="bg-pitch/95 fixed inset-0 z-60 flex flex-col"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div className="flex items-center justify-between gap-4 p-4">
        <span className="text-meta font-mono tracking-wide text-steel-text uppercase">
          {t("lightboxCounter", { current: index + 1, total: photos.length })}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="border-gold text-bone border px-3 py-1 font-mono text-xs tracking-wide uppercase"
        >
          {t("lightboxClose")}
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
        {photos.length > 1 && (
          <button
            type="button"
            aria-label={t("lightboxPrev")}
            onClick={() => onNavigate((index - 1 + photos.length) % photos.length)}
            className="border-gold text-bone absolute left-2 border px-3 py-4 font-mono uppercase md:left-6"
          >
            ‹
          </button>
        )}

        {!loaded && (
          <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner variant="cycle" size={56} />
          </div>
        )}

        <Image
          key={photo.id}
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes="100vw"
          onLoad={() => setLoadedIndex(index)}
          className="max-h-full max-w-full object-contain"
        />

        {photos.length > 1 && (
          <button
            type="button"
            aria-label={t("lightboxNext")}
            onClick={() => onNavigate((index + 1) % photos.length)}
            className="border-gold text-bone absolute right-2 border px-3 py-4 font-mono uppercase md:right-6"
          >
            ›
          </button>
        )}
      </div>

      {photo.credit && (
        <p className="text-meta text-steel-text px-4 pb-4 text-center uppercase">{photo.credit}</p>
      )}
    </div>,
    document.body,
  );
}
