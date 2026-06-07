import type { Transcript, TranscriptSegment, Speaker } from "./types";

export const hasElevenLabs = Boolean(process.env.ELEVENLABS_API_KEY);

const STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";

interface ScribeWord {
  text: string;
  type?: string; // "word" | "spacing" | ...
  speaker_id?: string; // e.g. "speaker_0"
  start?: number;
  end?: number;
}

interface ScribeResponse {
  language_code?: string;
  text?: string;
  words?: ScribeWord[];
}

/**
 * Transcribe an audio file with ElevenLabs Scribe, with diarization.
 * Language is auto-detected (we never pass language_code).
 *
 * `audioUrl` is a public/signed URL — Scribe fetches it directly, so the
 * audio never has to pass through our server (avoids Vercel body limits).
 */
export async function transcribe(audioUrl: string): Promise<Transcript> {
  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("diarize", "true");
  form.append("cloud_storage_url", audioUrl);

  const res = await fetch(STT_URL, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY as string },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs STT failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as ScribeResponse;
  return scribeToTranscript(data);
}

// Group word-level diarized output into speaker-labeled segments.
// Scribe gives raw speaker ids ("speaker_0", "speaker_1"); we map the
// FIRST speaker heard to "interviewer" (asks the first question) and the
// other to "subject". Tune later if needed.
function scribeToTranscript(data: ScribeResponse): Transcript {
  const words = (data.words ?? []).filter((w) => w.type !== "spacing");
  const language = data.language_code ?? "en";

  const order: string[] = [];
  for (const w of words) {
    const id = w.speaker_id ?? "speaker_0";
    if (!order.includes(id)) order.push(id);
  }
  const roleFor = (id: string): Speaker =>
    order[0] === id ? "interviewer" : "subject";

  const segments: TranscriptSegment[] = [];
  let cur: TranscriptSegment | null = null;
  for (const w of words) {
    const id = w.speaker_id ?? "speaker_0";
    const role = roleFor(id);
    if (!cur || cur.speaker !== role) {
      if (cur) segments.push(cur);
      cur = { speaker: role, text: w.text, start: w.start, end: w.end };
    } else {
      cur.text += (w.text.startsWith(" ") ? "" : " ") + w.text;
      cur.end = w.end;
    }
  }
  if (cur) segments.push(cur);

  return {
    language,
    segments: segments.map((s) => ({ ...s, text: s.text.trim() })),
  };
}
