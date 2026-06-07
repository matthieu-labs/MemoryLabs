"use client";

// Local audio store for recorded voice notes.
//
// Audio blobs are too large for localStorage (~5 MB cap), so the actual
// audio lives in IndexedDB keyed by the recording id. The lightweight
// metadata (which kind of audio a recording has) is kept alongside the
// recording in localStorage — see lib/store.ts.

const DB_NAME = "memoir.audio";
const STORE = "clips";
const SAMPLE_URL = "/sample-voice.wav";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putAudio(id: string, blob: Blob): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function getAudioBlob(id: string): Promise<Blob | null> {
  const db = await openDB();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

export const sampleAudioUrl = SAMPLE_URL;

// Resolve a playable URL for a recording's audio. Returns an object URL the
// caller must revoke (only for the "local" kind); remote/sample return shared
// URLs that should NOT be revoked. The boolean flags which.
export async function resolveAudioUrl(audio?: {
  kind: "local" | "remote" | "sample";
  url?: string;
}): Promise<{ url: string; revoke: boolean } | null> {
  if (!audio) return null;
  if (audio.kind === "remote" && audio.url) return { url: audio.url, revoke: false };
  if (audio.kind === "sample") return { url: SAMPLE_URL, revoke: false };
  if (audio.kind === "local") {
    try {
      const blob = await getAudioBlob(audio.url ?? "");
      if (blob) return { url: URL.createObjectURL(blob), revoke: true };
    } catch {
      /* fall through to sample */
    }
    return { url: SAMPLE_URL, revoke: false };
  }
  return null;
}
