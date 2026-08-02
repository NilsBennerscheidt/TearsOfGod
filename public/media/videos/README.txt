Drop video files (+ a poster frame image per video) here, then add one
entry per video to the `videos` array in content/media.ts:

  {
    id: "live-01",
    title: "Live at Werkstatt 44",
    src: "/media/videos/live-01.mp4",
    poster: "/media/videos/live-01-poster.jpg",
    width: 1920,
    height: 1080,
  }

Videos are self-hosted (a plain <video> tag), not YouTube/Instagram
embeds — see the comment in components/sections/VideoGrid.tsx for why.
Keep files reasonably compressed; nothing here is transcoded at build time.
