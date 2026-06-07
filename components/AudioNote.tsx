"use client";

import { useEffect, useState } from "react";
import { resolveAudioUrl } from "@/lib/audioStore";
import type { AudioMeta } from "@/lib/store";

// Plays back the voice note a chapter was generated from. Resolves the source
// asynchronously (IndexedDB for local clips) and cleans up object URLs.
export default function AudioNote({ audio }: { audio?: AudioMeta }) {
  const [src, setSrc] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    let revoke = false;
    let cancelled = false;
    resolveAudioUrl(audio).then((res) => {
      if (cancelled || !res) return;
      url = res.url;
      revoke = res.revoke;
      setSrc(res.url);
      setIsSample(audio?.kind === "sample" || (audio?.kind === "local" && !res.revoke));
    });
    return () => {
      cancelled = true;
      if (url && revoke) URL.revokeObjectURL(url);
    };
  }, [audio]);

  if (!audio || !src) return null;

  return (
    <div className="audio-note">
      <span className="audio-note-label">
        Voice note{isSample ? " · demo sample" : ""}
      </span>
      <audio className="audio-note-player" src={src} controls preload="none" />
    </div>
  );
}
