import Image from "next/image";
import type { MediaPhoto } from "@/content/media";

interface PhotoGridProps {
  photos: MediaPhoto[];
  emptyLabel: string;
}

/** Each tile links to the full-size file — no JS lightbox in this pass. */
export function PhotoGrid({ photos, emptyLabel }: PhotoGridProps) {
  if (photos.length === 0) {
    return <p className="text-body text-bone/80">{emptyLabel}</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo) => (
        <li key={photo.id}>
          <a href={photo.src} target="_blank" rel="noopener noreferrer" className="block border border-ash">
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              className="aspect-square h-full w-full object-cover"
            />
          </a>
          {photo.credit && <p className="text-meta mt-1 text-steel-text uppercase">{photo.credit}</p>}
        </li>
      ))}
    </ul>
  );
}
