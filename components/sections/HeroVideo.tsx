"use client";

import { useEffect, useRef } from "react";

/** Encoded from the "Break the Walls" video — see public/hero/README.txt. */
const HERO_WIDE = "/hero/break-the-walls-wide.mp4";
const HERO_SQUARE = "/hero/break-the-walls-square.mp4";

/**
 * The hero is 80dvh tall, so on a viewport narrower than 4:5 it is itself
 * narrower than 1:1 and object-cover would crop the 2.35:1 frame down to
 * its middle anyway. Those viewports get that middle pre-cropped at less
 * than half the bytes.
 */
const SQUARE_QUERY = "(max-aspect-ratio: 4/5)";

/** Longest the whole clip may take to arrive before the download is dropped. */
const DOWNLOAD_BUDGET_MS = 25_000;
/**
 * The download's speed is measured between these two points and judged
 * against the budget once. The first seconds are left out: right after
 * `load` the clip still shares the line with Next's link prefetches and
 * the icons, and reads slower than the connection really is.
 */
const PROBE_FROM_MS = 2_000;
const PROBE_UNTIL_MS = 5_000;

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Fetches the clip in full and resolves with a blob: URL for it, or null
 * if the connection is too slow to deliver it within DOWNLOAD_BUDGET_MS.
 */
async function downloadClip(src: string, signal: AbortSignal): Promise<string | null> {
  const response = await fetch(src, { signal, priority: "low" });
  const total = Number(response.headers.get("content-length"));
  if (!response.ok || !response.body) return null;

  const reader = response.body.getReader();
  const chunks: BlobPart[] = [];
  const startedAt = performance.now();
  let received = 0;
  let probe: { at: number; received: number } | null = null;
  let judged = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;

    const elapsed = performance.now() - startedAt;
    if (!probe && elapsed >= PROBE_FROM_MS) {
      probe = { at: elapsed, received };
    } else if (probe && !judged && total > 0 && elapsed >= PROBE_UNTIL_MS) {
      judged = true;
      const msPerByte = (elapsed - probe.at) / (received - probe.received);
      if (elapsed + (total - received) * msPerByte > DOWNLOAD_BUDGET_MS) {
        await reader.cancel();
        return null;
      }
    }
  }

  return URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
}

/**
 * Muted background loop behind the hero. Purely decorative: hidden from
 * assistive tech and unreachable by keyboard.
 *
 * The markup carries only the ~30 KB poster (the clip's first frame); the
 * clip itself is fetched by the effect below and handed to the element as
 * a blob. That is deliberate, not a roundabout `<source>`:
 *
 * - A streamed `<video>` starts playing on its first buffered second. On a
 *   connection slower than the clip's bitrate it then stutters for the
 *   whole download — measured at ~35 s on a 750 kbit/s line. Playing only
 *   what has fully arrived can't stall, and looping never refetches.
 * - The download starts after `load`, so it never competes with the
 *   page's own JS, fonts and images, and it is dropped early when the
 *   connection can't deliver it in reasonable time.
 *
 * Visitors who asked for reduced motion or reduced data never start the
 * download; they, and anyone whose download is dropped, keep the poster.
 */
export function HeroVideo({ poster, className }: { poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (
      connection?.saveData ||
      ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const abort = new AbortController();
    let objectUrl: string | null = null;
    let visible = false;

    const sync = () => {
      if (!objectUrl) return;
      if (visible) {
        // Rejected when the browser blocks autoplay (e.g. iOS Low Power
        // Mode) — the poster simply stays.
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    const start = () => {
      const src = window.matchMedia(SQUARE_QUERY).matches ? HERO_SQUARE : HERO_WIDE;
      downloadClip(src, abort.signal)
        .then((url) => {
          if (!url) return;
          if (abort.signal.aborted) {
            URL.revokeObjectURL(url);
            return;
          }
          objectUrl = url;
          // React sets `muted` as a property only after hydration; browsers
          // refuse a scripted play() on a video that isn't muted yet.
          video.muted = true;
          video.src = url;
          sync();
        })
        // Aborted on unmount, or the network failed — the poster stays.
        .catch(() => {});
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true, signal: abort.signal });

    // Pauses the decoder whenever the hero is scrolled out of view.
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      sync();
    });
    observer.observe(video);

    return () => {
      abort.abort();
      observer.disconnect();
      if (objectUrl) {
        video.removeAttribute("src");
        video.load();
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  return (
    <video
      ref={ref}
      aria-hidden="true"
      tabIndex={-1}
      muted
      loop
      playsInline
      disablePictureInPicture
      disableRemotePlayback
      preload="none"
      poster={poster}
      className={className}
    />
  );
}
