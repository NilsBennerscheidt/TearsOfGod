/**
 * Public profiles. Platform names are proper nouns, so they are not
 * translated (same reasoning as band/venue names elsewhere).
 *
 * Share-tracking parameters have been stripped from every URL:
 * Spotify's `?si=` and TikTok's `?_t=`/`?_r=` are attribution tokens
 * tied to the account that generated the share link. They serve no
 * purpose for a visitor, and publishing them would leak that identifier
 * to everyone who views the page. All links resolve identically without
 * them.
 */
export interface SocialLink {
  id: string;
  label: string;
  href: string;
}

export const socials: SocialLink[] = [
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/tearsofgodofficial/" },
  { id: "spotify", label: "Spotify", href: "https://open.spotify.com/artist/5fyxJSoXGtJJmEvF9zUj7O" },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@tearsofgod_official" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@tearsofgod_" },
  { id: "whatsapp", label: "WhatsApp", href: "https://www.whatsapp.com/channel/0029Vb3BYmcHVvTSQxzJ2Z3o" },
];

/** Channel used for the hero's "watch" action. */
export const youtubeUrl = "https://www.youtube.com/@tearsofgod_official";
