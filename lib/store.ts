"use client";

import type { GenerateResult } from "./types";

// Client-side history store (localStorage). Lets the Projects / Recordings
// screens work immediately, before Supabase is wired. When Supabase is
// configured, /api/generate also persists server-side; this can later be
// swapped to read from /api/projects.

// How a recording's audio can be played back:
//   local  → blob in IndexedDB, `url` holds the recording id (key)
//   remote → `url` is a hosted URL (e.g. Supabase public URL)
//   sample → bundled demo clip (used when no real audio was captured)
export interface AudioMeta {
  kind: "local" | "remote" | "sample";
  url?: string;
}

export interface StoredRecording extends GenerateResult {
  id: string;
  createdAt: number;
  audio?: AudioMeta;
  durationSec?: number;
  place?: string; // where it was recorded, if geolocation was available
}

// A voice note's display name: "<place>, 6.6.2026, 18:47:42" when we know
// where it was recorded, otherwise "Recording — 6.6.2026, 18:47:42".
export function recordingName(rec: StoredRecording): string {
  const d = new Date(rec.createdAt);
  const date = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const stamp = `${date}, ${time}`;
  return rec.place ? `${rec.place}, ${stamp}` : `Recording — ${stamp}`;
}

export function formatDuration(sec?: number): string | null {
  if (!sec && sec !== 0) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export interface StoredProject {
  name: string;
  recordings: StoredRecording[];
}

const KEY = "memoir.projects";

function read(): StoredProject[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as StoredProject[];
  } catch {
    return [];
  }
}

function write(projects: StoredProject[]) {
  localStorage.setItem(KEY, JSON.stringify(projects));
}

export function loadProjects(): StoredProject[] {
  // Newest-updated project first.
  return read().sort((a, b) => lastUpdated(b) - lastUpdated(a));
}

export function lastUpdated(p: StoredProject): number {
  return p.recordings.reduce((m, r) => Math.max(m, r.createdAt), 0);
}

export function getProject(name: string): StoredProject | undefined {
  return read().find((p) => p.name === name);
}

// A voice note plus the person (story) it was filed under. Used by the global
// "Recordings" and "Articles" tabs, which span every person.
export interface RecordingWithPerson {
  rec: StoredRecording;
  person: string;
}

export function loadAllRecordings(): RecordingWithPerson[] {
  return read()
    .flatMap((p) => p.recordings.map((rec) => ({ rec, person: p.name })))
    .sort((a, b) => b.rec.createdAt - a.rec.createdAt);
}

export function addRecording(
  projectName: string,
  result: GenerateResult,
  extra?: { audio?: AudioMeta; durationSec?: number; place?: string }
): StoredRecording {
  const projects = read();
  const rec: StoredRecording = {
    ...result,
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
    createdAt: Date.now(),
    audio: extra?.audio,
    durationSec: extra?.durationSec,
    place: extra?.place,
  };
  let project = projects.find((p) => p.name === projectName);
  if (!project) {
    project = { name: projectName, recordings: [] };
    projects.push(project);
  }
  project.recordings.push(rec);
  write(projects);
  return rec;
}

// Update a recording's audio metadata (e.g. after the blob has been written to
// IndexedDB and we know the key). No-op if the recording can't be found.
export function updateRecordingAudio(
  projectName: string,
  id: string,
  audio: AudioMeta
) {
  const projects = read();
  const rec = projects
    .find((p) => p.name === projectName)
    ?.recordings.find((r) => r.id === id);
  if (!rec) return;
  rec.audio = audio;
  write(projects);
}
