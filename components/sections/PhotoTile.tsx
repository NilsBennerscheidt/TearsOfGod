"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { MediaPhoto } from "@/types/content";

interface PhotoTileProps {
  photo: MediaPhoto;
  onOpen: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * One grid tile: the image plus a brand-loader overlay until it's
 * actually decoded, rather than a bare blank box while an 8K source
 * downloads. `sizes` matters here — the source files are up to 8192px
 * wide; without it next/image builds a srcset weighted for a
 * full-viewport image on a tile that renders at a few hundred px.
 *
 * Still a real `<a href>` to the full-size file, not a `<button>` or a
 * `<div onClick>` — `onOpen` intercepts the click to show the lightbox
 * instead (see PhotoGrid), but a modifier-click (cmd/ctrl/shift, or
 * middle-click) bypasses that and opens/downloads the file directly, the
 * way any other link on the page does.
 */
export function PhotoTile({ photo, onOpen }: PhotoTileProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // A cached image can finish decoding before hydration attaches onLoad —
  // onLoad never fires for it, and the overlay would be stuck forever.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <a
      href={photo.src}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpen}
      className="relative block aspect-square overflow-hidden border border-ash"
    >
      {!loaded && (
        <div aria-hidden="true" className="bg-pitch absolute inset-0 flex items-center justify-center">
          <LoadingSpinner variant="cycle" size={28} />
        </div>
      )}
      <Image
        ref={imgRef}
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
        onLoad={() => setLoaded(true)}
        className="h-full w-full object-cover"
      />
    </a>
  );
}
