"use client";

import { useState } from "react";
import { fetchJson } from "@/lib/admin/fetch-json";
import { photoToJson, pretty, videoToEmbed, type JsonTemplate } from "@/lib/admin/json-templates";
import type { MediaPhoto, MediaVideo } from "@/types/content";

interface Library {
  photos: MediaPhoto[];
  videos: MediaVideo[];
}

interface JsonFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  templates: JsonTemplate[];
  /** "photo": pick replaces the value. "photos": pick is appended to the array. "video": pick becomes a video embed. */
  pick?: "photo" | "photos" | "video";
  rows?: number;
}

function parseError(value: string): string | null {
  if (!value.trim()) return null;
  try {
    JSON.parse(value);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Invalid JSON";
  }
}

/**
 * Raw-JSON textarea with an "Insert template" dropdown, an optional
 * media-library picker and a live syntax check. Schema validation still
 * happens server-side on save — this only saves typing and catches
 * syntax slips early.
 */
export function JsonField({ label, value, onChange, templates, pick, rows = 4 }: JsonFieldProps) {
  const [library, setLibrary] = useState<Library | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [libError, setLibError] = useState<string | null>(null);
  const error = parseError(value);

  function confirmOverwrite() {
    return !value.trim() || confirm("Replace the current content of this field?");
  }

  /** Array templates are appended to an existing array; object templates (cover, embed) can only replace. */
  function applyTemplate(template: JsonTemplate) {
    if (Array.isArray(template.value) && value.trim()) {
      try {
        const existing = JSON.parse(value);
        if (Array.isArray(existing)) {
          onChange(pretty([...existing, ...template.value]));
          return;
        }
      } catch {
        // fall through to the overwrite prompt below
      }
    }
    if (confirmOverwrite()) onChange(pretty(template.value));
  }

  async function openPicker() {
    setPickerOpen((open) => !open);
    if (library) return;
    try {
      setLibrary(await fetchJson<Library>("/api/admin/media"));
    } catch (err) {
      setLibError(err instanceof Error ? err.message : "Couldn't load the media library.");
    }
  }

  function applyPhoto(photo: MediaPhoto) {
    const json = photoToJson(photo);
    if (pick === "photos") {
      let existing: unknown[] = [];
      if (value.trim()) {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) throw new Error("not an array");
          existing = parsed;
        } catch {
          if (!confirm("Current content isn't a valid JSON array — replace it?")) return;
        }
      }
      onChange(pretty([...existing, json]));
    } else {
      if (!confirmOverwrite()) return;
      onChange(pretty(json));
    }
    setPickerOpen(false);
  }

  function applyVideo(video: MediaVideo) {
    if (!confirmOverwrite()) return;
    onChange(pretty(videoToEmbed(video)));
    setPickerOpen(false);
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-meta text-steel-text uppercase">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value=""
          onChange={(e) => {
            const template = templates[Number(e.target.value)];
            if (template) applyTemplate(template);
          }}
          className="border border-ash bg-transparent px-2 py-1 text-xs"
          aria-label={`Insert template for ${label}`}
        >
          <option value="">{templates.some((t) => Array.isArray(t.value)) ? "Add template…" : "Insert template…"}</option>
          {templates.map((t, i) => (
            <option key={t.label} value={i} className="bg-black">
              {t.label}
            </option>
          ))}
        </select>
        {pick && (
          <button type="button" onClick={openPicker} className="border border-ash px-2 py-1 font-mono text-xs uppercase">
            {pick === "photos" ? "Add from library" : "Pick from library"}
          </button>
        )}
        {value.trim() && (
          <button type="button" onClick={() => onChange("")} className="text-meta text-steel-text uppercase underline">
            Clear
          </button>
        )}
      </div>

      {pickerOpen && (
        <div className="border border-ash p-2">
          {libError ? (
            <p className="text-blood-text text-xs">{libError}</p>
          ) : !library ? (
            <p className="text-xs">Loading…</p>
          ) : pick === "video" ? (
            library.videos.length === 0 ? (
              <p className="text-xs">No videos in the library.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {library.videos.map((v) => (
                  <li key={v.id}>
                    <button type="button" onClick={() => applyVideo(v)} className="text-gold hover:text-gold-hi text-xs underline">
                      {v.title}
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : library.photos.length === 0 ? (
            <p className="text-xs">No photos in the library.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {library.photos.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => applyPhoto(p)} title={p.alt} className="block w-full border border-ash hover:border-gold">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail, no need for next/image */}
                    <img src={p.src} alt={p.alt} loading="lazy" className="aspect-square w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
        className="w-full border border-ash bg-transparent px-2 py-1 font-mono text-xs"
      />
      {value.trim() && (error ? <p className="text-blood-text text-xs">Invalid JSON: {error}</p> : <p className="text-steel-text text-xs">Valid JSON</p>)}
    </div>
  );
}
