Background loop for the landing-page hero (components/sections/HeroVideo.tsx).
Not part of the /media gallery — that one lives in public/media/videos.

  break-the-walls-wide.mp4     1920x816, desktop / landscape
  break-the-walls-square.mp4   720x720 centre crop, portrait phones
  break-the-walls-poster.jpg   first frame, shown until the video plays

Nothing here is transcoded at build time. To replace the clip, export a
10-20 s cut at 1920x816 and encode all three from it:

  ffmpeg -i in.mp4 -map 0:v:0 -an -map_metadata -1 -vf format=yuv420p \
    -c:v libx264 -crf 32 -preset veryslow -movflags +faststart break-the-walls-wide.mp4

  ffmpeg -i in.mp4 -map 0:v:0 -an -map_metadata -1 \
    -vf "crop=816:816,scale=720:720,format=yuv420p" \
    -c:v libx264 -crf 31 -preset veryslow -movflags +faststart break-the-walls-square.mp4

  ffmpeg -i in.mp4 -frames:v 1 -vf scale=1280:-2 -q:v 6 break-the-walls-poster.jpg

The high CRF is deliberate: the hero lays a 45-92 % dark gradient and a
halftone over the footage, which hides the compression.
