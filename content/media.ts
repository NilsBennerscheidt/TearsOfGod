/**
 * Media page assets — photos and videos. Both arrays are empty until real
 * files are dropped in under public/media/photos/ and public/media/videos/;
 * the /media page renders an explicit "coming soon" state for whichever
 * array is empty rather than an empty grid, so the page is correct before
 * either exists.
 */
export interface MediaPhoto {
  id: string;
  /** Path under public/media/photos/, e.g. "/media/photos/live-01.jpg". */
  src: string;
  /** Required — next/image needs it, and it's the a11y label besides. */
  alt: string;
  /** Intrinsic pixel dimensions, required by next/image for local files without a loader. */
  width: number;
  height: number;
  credit?: string;
}

export interface MediaVideo {
  id: string;
  title: string;
  /** Path under public/media/videos/, e.g. "/media/videos/live-01.mp4". */
  src: string;
  /** Poster frame, path under public/media/videos/. */
  poster: string;
  width: number;
  height: number;
}

export const photos: MediaPhoto[] = [
  {
    id: "bandfotos-0002",
    src: "/media/photos/2025-01-05_-_Tears_of_God_Bandfotos_0002.jpg",
    alt: "Tears of God — full band studio portrait",
    width: 8192,
    height: 5464,
  },
  {
    id: "bandfotos-0003",
    src: "/media/photos/2025-01-05_-_Tears_of_God_Bandfotos_0003.jpg",
    alt: "Tears of God — full band studio portrait with instruments",
    width: 8192,
    height: 5464,
  },
  {
    id: "auftritt-0041",
    src: "/media/photos/2025-03-21_-_Tears_of_God_Band_Auftritt_0041.jpg",
    alt: "Tears of God vocalist performing live on stage",
    width: 5462,
    height: 8189,
  },
  {
    id: "auftritt-0044",
    src: "/media/photos/2025-03-21_-_Tears_of_God_Band_Auftritt_0044.jpg",
    alt: "Tears of God bassist performing live on stage",
    width: 5462,
    height: 8189,
  },
  {
    id: "auftritt-0056",
    src: "/media/photos/2025-03-21_-_Tears_of_God_Band_Auftritt_0056.jpg",
    alt: "Tears of God guitarist performing live on stage",
    width: 3648,
    height: 5469,
  },
  {
    id: "bandfotos-murk",
    src: "/media/photos/2025-01-05_-_Tears_of_God_Bandfotos_Murk.jpg",
    alt: "Murk — studio portrait",
    width: 5464,
    height: 8192,
  },
  {
    id: "bandfotos-danji",
    src: "/media/photos/2025-01-05_-_Tears_of_God_Bandfotos_Danji.jpg",
    alt: "Danji — studio portrait",
    width: 5464,
    height: 8192,
  },
  {
    id: "bandfotos-nils",
    src: "/media/photos/2025-01-05_-_Tears_of_God_Bandfotos_Nols.jpg",
    alt: "Nils — studio portrait",
    width: 5464,
    height: 8192,
  },
  {
    id: "bandfotos-lars",
    src: "/media/photos/2025-01-05_-_Tears_of_God_Bandfotos_Lars.jpg",
    alt: "Lars — studio portrait",
    width: 5464,
    height: 8192,
  },
  {
    id: "bandfotos-gary",
    src: "/media/photos/2025-01-05_-_Tears_of_God_Bandfotos_Gary.jpg",
    alt: "Gary — studio portrait",
    width: 5464,
    height: 8192,
  },
];

export const videos: MediaVideo[] = [];
