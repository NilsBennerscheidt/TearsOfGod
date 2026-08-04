"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { fetchJson } from "@/lib/admin/fetch-json";
import type { MediaPhoto, MediaVideo } from "@/types/content";

interface MediaFile {
  photos: MediaPhoto[];
  videos: MediaVideo[];
}

function invalidReasons(media: MediaFile): string[] {
  const reasons: string[] = [];
  media.photos.forEach((photo, i) => {
    if (!photo.alt.trim()) reasons.push(`Photo #${i + 1} (${photo.src}) is missing alt text.`);
  });
  media.videos.forEach((video, i) => {
    if (!video.title.trim()) reasons.push(`Video #${i + 1} (${video.src}) is missing a title.`);
    if (!video.poster.startsWith("/media/videos/")) {
      reasons.push(`Video #${i + 1} (${video.src}) needs a poster path under /media/videos/.`);
    }
  });
  return reasons;
}

/**
 * Client Component: loads content/media.json through /api/admin/media,
 * edits the whole photos/videos array in memory, and PUTs it back in one
 * shot. Uploads go through /api/admin/upload first (which writes the
 * file and returns real dimensions read from the bytes), then the
 * returned {src, width, height} is appended to the in-memory array — the
 * upload and the JSON save are two separate steps, so an upload that
 * succeeds but a save the user never confirms doesn't silently lose the
 * file (it's just an unreferenced file in public/, visible to
 * `git status`, not a crash).
 *
 * `mediaFileSchema` requires non-empty alt/title and a valid poster path
 * (lib/schemas/media.ts) — the server rejects a save that doesn't meet
 * those, so `invalidReasons` mirrors the same checks client-side and
 * disables Save with a specific reason instead of the user finding out
 * from an opaque "Error: photos.4.alt: Too small" after the fact.
 */
export default function MediaAdminPage() {
  const [media, setMedia] = useState<MediaFile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchJson<MediaFile>("/api/admin/media")
      .then(setMedia)
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  const reasons = useMemo(() => (media ? invalidReasons(media) : []), [media]);

  async function handleSave() {
    if (!media) return;
    setSaving(true);
    setStatus(null);
    try {
      await fetchJson("/api/admin/media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(media),
      });
      setStatus("Saved.");
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : "Something went wrong."}`);
    } finally {
      setSaving(false);
    }
  }

  if (loadError) return <p className="text-blood-text">Couldn&apos;t load media: {loadError}</p>;
  if (!media) return <p>Loading…</p>;

  return (
    <div className="flex flex-col gap-10">
      <PhotosSection
        photos={media.photos}
        onChange={(updater) => setMedia((m) => (m ? { ...m, photos: updater(m.photos) } : m))}
      />
      <VideosSection
        videos={media.videos}
        onChange={(updater) => setMedia((m) => (m ? { ...m, videos: updater(m.videos) } : m))}
      />

      <div className="flex flex-col gap-2 border-t border-ash pt-4">
        {reasons.length > 0 && (
          <ul className="text-meta text-blood-text list-disc pl-5">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || reasons.length > 0}
            className="border-gold text-gold hover:text-gold-hi border px-4 py-2 font-mono text-xs uppercase disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {status && <span className="text-meta text-steel-text">{status}</span>}
        </div>
      </div>
    </div>
  );
}

/** Filename-derived id, made unique with a short random suffix — two uploads that sanitize to the same base name (e.g. "Live 01.jpg" and "live-01.JPG") must not collide as React keys or overwrite each other's metadata in the saved array. */
function uniqueId(src: string): string {
  const base = src.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "upload";
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${base}-${suffix}`;
}

function PhotosSection({
  photos,
  onChange,
}: {
  photos: MediaPhoto[];
  onChange: (updater: (photos: MediaPhoto[]) => MediaPhoto[]) => void;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    // Each successful upload is appended via a functional update, not by
    // accumulating against the `photos` prop captured when this handler
    // started — a multi-file upload awaits one request per file, and an
    // edit made elsewhere (alt text, reorder) while it's in flight would
    // otherwise be silently discarded when the stale array is written back.
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("kind", "photos");
      try {
        const { src, width, height } = await fetchJson<{ src: string; width: number; height: number }>(
          "/api/admin/upload",
          { method: "POST", body: formData },
        );
        const photo: MediaPhoto = { id: uniqueId(src), src, alt: "", width, height };
        onChange((prev) => [...prev, photo]);
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      }
    }

    setUploading(false);
    if (errors.length > 0) setUploadError(errors.join(" · "));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function update(index: number, patch: Partial<MediaPhoto>) {
    onChange((prev) => prev.map((photo, i) => (i === index ? { ...photo, ...patch } : photo)));
  }

  function remove(index: number) {
    if (!confirm("Remove this photo from the media library? The file itself stays in public/.")) return;
    onChange((prev) => prev.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    onChange((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      if (!item) return prev;
      next.splice(target, 0, item);
      return next;
    });
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg text-gold uppercase">Photos ({photos.length})</h2>
        <label htmlFor={inputId} className="border-gold text-gold hover:text-gold-hi cursor-pointer border px-3 py-1 font-mono text-xs uppercase">
          {uploading ? "Uploading…" : "Upload"}
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </label>
      </div>

      {uploadError && <p className="text-meta text-blood-text mb-3">{uploadError}</p>}

      <ul className="flex flex-col gap-3">
        {photos.map((photo, index) => (
          <li key={photo.id} className="flex gap-3 border border-ash p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail; a fixed-size arbitrary local file preview doesn't need next/image's optimizer */}
            <img src={photo.src} alt="" className="h-20 w-20 shrink-0 object-cover" />
            <div className="flex flex-1 flex-col gap-2">
              <input
                type="text"
                value={photo.alt}
                placeholder="Alt text (required)"
                onChange={(e) => update(index, { alt: e.target.value })}
                className="border border-ash bg-transparent px-2 py-1 text-sm"
              />
              <input
                type="text"
                value={photo.credit ?? ""}
                placeholder="Credit (optional)"
                onChange={(e) => update(index, { credit: e.target.value || undefined })}
                className="border border-ash bg-transparent px-2 py-1 text-sm"
              />
              <p className="text-meta text-steel-text">
                {photo.width}×{photo.height} · {photo.src}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <button type="button" onClick={() => move(index, -1)} className="border border-ash px-2 text-xs">
                ↑
              </button>
              <button type="button" onClick={() => move(index, 1)} className="border border-ash px-2 text-xs">
                ↓
              </button>
              <button type="button" onClick={() => remove(index)} className="border border-blood-text px-2 text-xs text-blood-text">
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VideosSection({
  videos,
  onChange,
}: {
  videos: MediaVideo[];
  onChange: (updater: (videos: MediaVideo[]) => MediaVideo[]) => void;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    const errors: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("kind", "videos");
      try {
        const { src } = await fetchJson<{ src: string }>("/api/admin/upload", { method: "POST", body: formData });
        const video: MediaVideo = { id: uniqueId(src), title: "", src, poster: "", width: 1280, height: 720 };
        onChange((prev) => [...prev, video]);
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      }
    }

    setUploading(false);
    if (errors.length > 0) setUploadError(errors.join(" · "));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function update(index: number, patch: Partial<MediaVideo>) {
    onChange((prev) => prev.map((video, i) => (i === index ? { ...video, ...patch } : video)));
  }

  function remove(index: number) {
    if (!confirm("Remove this video from the media library? The file itself stays in public/.")) return;
    onChange((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg text-gold uppercase">Videos ({videos.length})</h2>
        <label htmlFor={inputId} className="border-gold text-gold hover:text-gold-hi cursor-pointer border px-3 py-1 font-mono text-xs uppercase">
          {uploading ? "Uploading…" : "Upload"}
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="video/mp4,video/webm"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </label>
      </div>

      {uploadError && <p className="text-meta text-blood-text mb-3">{uploadError}</p>}

      <ul className="flex flex-col gap-3">
        {videos.map((video, index) => (
          <li key={video.id} className="flex flex-col gap-2 border border-ash p-3">
            <input
              type="text"
              value={video.title}
              placeholder="Title"
              onChange={(e) => update(index, { title: e.target.value })}
              className="border border-ash bg-transparent px-2 py-1 text-sm"
            />
            <input
              type="text"
              value={video.poster}
              placeholder="Poster path, e.g. /media/videos/live-01-poster.jpg"
              onChange={(e) => update(index, { poster: e.target.value })}
              className="border border-ash bg-transparent px-2 py-1 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={video.width}
                onChange={(e) => update(index, { width: Number(e.target.value) })}
                className="w-24 border border-ash bg-transparent px-2 py-1 text-sm"
              />
              <input
                type="number"
                value={video.height}
                onChange={(e) => update(index, { height: Number(e.target.value) })}
                className="w-24 border border-ash bg-transparent px-2 py-1 text-sm"
              />
              <p className="text-meta text-steel-text self-center">{video.src}</p>
              <button
                type="button"
                onClick={() => remove(index)}
                className="border-blood-text text-blood-text ml-auto border px-2 text-xs"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
