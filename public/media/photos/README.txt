Drop photo files here, then add one entry per photo to the `photos` array
in content/media.ts:

  {
    id: "live-01",
    src: "/media/photos/live-01.jpg",
    alt: "Describe what's actually in the shot — required, used as the a11y label.",
    width: 1600,   // actual pixel width of the file
    height: 1067,  // actual pixel height of the file
    credit: "Photographer Name", // optional
  }

`width`/`height` must match the real file — next/image uses them to
reserve layout space before the image loads.
