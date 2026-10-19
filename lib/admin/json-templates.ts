import { POST_LINK_PLATFORMS, type PostLinkPlatform } from "@/lib/post-links";
import type { MediaPhoto, MediaVideo } from "@/types/content";

const photoTemplate = {
  id: "unique-photo-id",
  src: "/media/photos/example.jpg",
  alt: "Describe the photo",
  width: 1600,
  height: 1000,
  credit: "Photographer",
};

export interface JsonTemplate {
  label: string;
  value: unknown;
}

export const COVER_TEMPLATES: JsonTemplate[] = [{ label: "Photo", value: photoTemplate }];

export const GALLERY_TEMPLATES: JsonTemplate[] = [
  { label: "One photo", value: [photoTemplate] },
  { label: "Two photos", value: [photoTemplate, { ...photoTemplate, id: "unique-photo-id-2" }] },
];

export const EMBED_TEMPLATES: JsonTemplate[] = [
  { label: "Spotify link", value: { kind: "spotify", url: "https://open.spotify.com/album/..." } },
  {
    label: "Self-hosted video",
    value: {
      kind: "video",
      src: "/media/videos/example.mp4",
      poster: "/media/videos/example-poster.jpg",
      width: 1920,
      height: 1080,
      title: "Video title",
    },
  },
];

const linkExamples: Record<PostLinkPlatform, string> = {
  spotify: "https://open.spotify.com/album/...",
  "apple-music": "https://music.apple.com/...",
  youtube: "https://www.youtube.com/watch?v=...",
  "youtube-music": "https://music.youtube.com/watch?v=...",
  bandcamp: "https://tearsofgod.bandcamp.com/...",
  soundcloud: "https://soundcloud.com/...",
  instagram: "https://www.instagram.com/p/...",
  tiktok: "https://www.tiktok.com/@.../video/...",
  facebook: "https://www.facebook.com/...",
  link: "https://example.com",
};

export const LINKS_TEMPLATES: JsonTemplate[] = [
  ...(Object.keys(POST_LINK_PLATFORMS) as PostLinkPlatform[]).map((platform) => ({
    label: POST_LINK_PLATFORMS[platform].label,
    value: [{ platform, url: linkExamples[platform] }],
  })),
  {
    label: "All streaming + social",
    value: (["spotify", "youtube", "youtube-music", "instagram", "tiktok"] as const).map((platform) => ({
      platform,
      url: linkExamples[platform],
    })),
  },
];

/** Library photo → the exact shape cover/gallery entries take (credit omitted when unset). */
export function photoToJson(photo: MediaPhoto) {
  const { id, src, alt, width, height, credit } = photo;
  return { id, src, alt, width, height, ...(credit ? { credit } : {}) };
}

/** Library video → an `embed` of kind "video". */
export function videoToEmbed(video: MediaVideo) {
  const { src, poster, width, height, title } = video;
  return { kind: "video", src, poster, width, height, title };
}

export const pretty = (value: unknown) => JSON.stringify(value, null, 2);
