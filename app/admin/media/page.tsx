"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MediaPhoto, MediaVideo } from "@/types/content";

interface MediaFile {
  photos: MediaPhoto[];
  videos: MediaVideo[];
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
 */
export default function MediaAdminPage() {
  const [media, setMedia] = useState<MediaFile | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/media")
      .then((res) => res.json())
      .then(setMedia);
  }, []);

  async function handleSave() {
    if (!media) return;
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/admin/media", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(media),
    });
    const json = await res.json();
    setSaving(false);
    setStatus(res.ok ? "Saved." : `Error: ${json.error}`);
  }

  if (!media) return <p>Loading…</p>;

  return (
    <div className="flex flex-col gap-10">
      <PhotosSection photos={media.photos} onChange={(photos) => setMedia({ ...media, photos })} />
      <VideosSection videos={media.videos} onChange={(videos) => setMedia({ ...media, videos })} />

      <div className="flex items-center gap-4 border-t border-ash pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="border-gold text-gold hover:text-gold-hi border px-4 py-2 font-mono text-xs uppercase disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {status && <span className="text-meta text-steel-text">{status}</span>}
      </div>
    </div>
  );
}

function PhotosSection({ photos, onChange }: { photos: MediaPhoto[]; onChange: (photos: MediaPhoto[]) => void }) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    const next = [...photos];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("kind", "photos");
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { src, width, height } = await res.json();
        next.push({ id: src.split("/").pop().replace(/\.[^.]+$/, ""), src, alt: "", width, height });
      }
    }
    onChange(next);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function update(index: number, patch: Partial<MediaPhoto>) {
    onChange(photos.map((photo, i) => (i === index ? { ...photo, ...patch } : photo)));
  }

  function remove(index: number) {
    if (!confirm("Remove this photo from the media library? The file itself stays in public/.")) return;
    onChange(photos.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    onChange(next);
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

function VideosSection({ videos, onChange }: { videos: MediaVideo[]; onChange: (videos: MediaVideo[]) => void }) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    const next = [...videos];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("kind", "videos");
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { src } = await res.json();
        next.push({ id: src.split("/").pop().replace(/\.[^.]+$/, ""), title: "", src, poster: "", width: 1280, height: 720 });
      }
    }
    onChange(next);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function update(index: number, patch: Partial<MediaVideo>) {
    onChange(videos.map((video, i) => (i === index ? { ...video, ...patch } : video)));
  }

  function remove(index: number) {
    if (!confirm("Remove this video from the media library? The file itself stays in public/.")) return;
    onChange(videos.filter((_, i) => i !== index));
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
