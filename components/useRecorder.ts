"use client";

import { useCallback, useRef, useState } from "react";

// Picks a MIME type the current browser actually supports.
// iOS Safari → audio/mp4; Chrome/Android → audio/webm.
function pickMime(): string {
  const candidates = ["audio/webm", "audio/mp4", "audio/ogg"];
  for (const m of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
      return m;
    }
  }
  return "";
}

export interface RecorderState {
  recording: boolean;
  paused: boolean;
  seconds: number;
  error: string | null;
  simulated: boolean;
  start: () => Promise<void>;
  startSimulated: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<Blob | null>;
}

export function useRecorder(): RecorderState {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [simulated, setSimulated] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef<string>("");

  function startInterval() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }
  function runTimer() {
    setSeconds(0);
    startInterval();
  }

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      mimeRef.current = mime;
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start();
      mediaRef.current = mr;
      setSimulated(false);
      setPaused(false);
      setRecording(true);
      runTimer();
    } catch (e) {
      setError(
        "Microphone access was blocked. Use HTTPS and allow the mic — or upload an audio file instead."
      );
      throw e;
    }
  }, []);

  // Dev/demo fallback: a "recording" with no microphone. Stop() yields no blob,
  // so the pipeline runs on the mock transcript. Used when the mic is blocked
  // in local dev (e.g. inside an embedded preview).
  const startSimulated = useCallback(() => {
    setError(null);
    mediaRef.current = null;
    chunksRef.current = [];
    setSimulated(true);
    setPaused(false);
    setRecording(true);
    runTimer();
  }, []);

  const pause = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      if (mediaRef.current && mediaRef.current.state === "recording")
        mediaRef.current.pause();
    } catch {
      /* ignore */
    }
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    try {
      if (mediaRef.current && mediaRef.current.state === "paused")
        mediaRef.current.resume();
    } catch {
      /* ignore */
    }
    setPaused(false);
    startInterval();
  }, []);

  const stop = useCallback(async (): Promise<Blob | null> => {
    const mr = mediaRef.current;
    let blob: Blob | null = null;
    if (mr) {
      const mime = mimeRef.current || "audio/webm";
      blob = await new Promise<Blob>((resolve) => {
        mr.onstop = () => resolve(new Blob(chunksRef.current, { type: mime }));
        mr.stop();
      });
    }
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
    setPaused(false);
    setSimulated(false);
    return blob;
  }, []);

  return {
    recording,
    paused,
    seconds,
    error,
    simulated,
    start,
    startSimulated,
    pause,
    resume,
    stop,
  };
}

export function ext(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}
