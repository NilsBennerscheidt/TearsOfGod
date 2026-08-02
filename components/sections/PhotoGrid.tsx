"use client";

import { useState, type MouseEvent } from "react";
import type { MediaPhoto } from "@/types/content";
import { PhotoLightbox } from "./PhotoLightbox";
import { PhotoTile } from "./PhotoTile";

interface PhotoGridProps {
  photos: MediaPhoto[];
  /** Shown in place of the grid when `photos` is empty. Omit when the caller already guards on a non-empty array (e.g. a post's optional gallery, only rendered at all when it has entries). */
  emptyLabel?: string;
}

/**
 * Client Component: owns which photo (if any) the lightbox is showing.
 * Tiles stay real `<a href>` links to the full-size file (see PhotoTile)
 * — a plain click opens the lightbox instead of navigating, but a
 * modifier-click (cmd/ctrl/shift) or middle-click is left alone, so the
 * "open in new tab" / "save as" behavior every other link on the page has
 * still works here.
 */
export function PhotoGrid({ photos, emptyLabel = "" }: PhotoGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return <p className="text-body text-bone/80">{emptyLabel}</p>;
  }

  function openAt(index: number) {
    return (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      setOpenIndex(index);
    };
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <PhotoTile photo={photo} onOpen={openAt(index)} />
            {photo.credit && <p className="text-meta mt-1 text-steel-text uppercase">{photo.credit}</p>}
          </li>
        ))}
      </ul>
      <PhotoLightbox photos={photos} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
    </>
  );
}
