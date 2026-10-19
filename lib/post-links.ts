/**
 * Platforms a post can link out to. `hosts` are the hostname suffixes a
 * URL must end in (so a YouTube link pasted into an Instagram entry is
 * caught on save); `link` is the generic any-URL escape hatch. Plain
 * outbound links only — no iframes, same privacy reasoning as PostEmbed.
 */
export const POST_LINK_PLATFORMS = {
  spotify: { label: "Spotify", hosts: ["spotify.com", "spotify.link"] },
  "apple-music": { label: "Apple Music", hosts: ["music.apple.com", "apple.co"] },
  youtube: { label: "YouTube", hosts: ["youtube.com", "youtu.be"] },
  "youtube-music": { label: "YouTube Music", hosts: ["music.youtube.com"] },
  bandcamp: { label: "Bandcamp", hosts: ["bandcamp.com"] },
  soundcloud: { label: "SoundCloud", hosts: ["soundcloud.com", "on.soundcloud.com"] },
  instagram: { label: "Instagram", hosts: ["instagram.com", "instagr.am"] },
  tiktok: { label: "TikTok", hosts: ["tiktok.com"] },
  facebook: { label: "Facebook", hosts: ["facebook.com", "fb.com", "fb.me"] },
  link: { label: "Link", hosts: [] as string[] },
} as const;

export type PostLinkPlatform = keyof typeof POST_LINK_PLATFORMS;

export const POST_LINK_PLATFORM_KEYS = Object.keys(POST_LINK_PLATFORMS) as [PostLinkPlatform, ...PostLinkPlatform[]];

export function urlMatchesPlatform(platform: PostLinkPlatform, url: string): boolean {
  const { hosts } = POST_LINK_PLATFORMS[platform];
  if (hosts.length === 0) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return hosts.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/** Button text: explicit label, else the platform name, else (generic link) the hostname. */
export function postLinkText(link: { platform: PostLinkPlatform; url: string; label?: string }): string {
  if (link.label) return link.label;
  if (link.platform !== "link") return POST_LINK_PLATFORMS[link.platform].label;
  try {
    return new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    return link.url;
  }
}
