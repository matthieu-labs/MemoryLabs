import { NextResponse } from "next/server";
import { transcribe, hasElevenLabs } from "@/lib/elevenlabs";
import { runPipeline } from "@/lib/pipeline";
import { hasQwen } from "@/lib/qwen";
import {
  supabaseAdmin,
  hasSupabase,
  RECORDINGS_BUCKET,
} from "@/lib/supabase";
import { MOCK_TRANSCRIPT, MOCK_CHAPTER } from "@/lib/mock";
import type { Transcript, Chapter, GenerateResult } from "@/lib/types";

export const maxDuration = 60; // allow the pipeline time to run

interface Body {
  topic?: string;
  projectName?: string;
  audioPath?: string; // path inside the Supabase "recordings" bucket
  audioUrl?: string; // or a direct public/signed URL
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* empty body → full mock run */
  }

  const topic = body.topic?.trim() || "School";

  // 1) Resolve a fetchable audio URL (or fall back to a mock transcript).
  let audioUrl = body.audioUrl;
  if (!audioUrl && body.audioPath && hasSupabase) {
    const { data } = supabaseAdmin()
      .storage.from(RECORDINGS_BUCKET)
      .getPublicUrl(body.audioPath);
    audioUrl = data.publicUrl;
  }

  // 2) Transcribe (ElevenLabs Scribe) or mock.
  let transcript: Transcript;
  let transcriptMocked = false;
  try {
    if (audioUrl && hasElevenLabs) {
      transcript = await transcribe(audioUrl);
    } else {
      transcript = MOCK_TRANSCRIPT;
      transcriptMocked = true;
    }
  } catch (e) {
    return NextResponse.json(
      { error: `Transcription failed: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  // 3) Generate the chapter (Qwen pipeline) or mock.
  let chapter: Chapter;
  let chapterMocked = false;
  try {
    if (hasQwen) {
      chapter = await runPipeline(transcript, topic);
    } else {
      chapter = { ...MOCK_CHAPTER, topic };
      chapterMocked = true;
    }
  } catch (e) {
    return NextResponse.json(
      { error: `Chapter generation failed: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  // 4) Persist history (best-effort — never blocks the response).
  if (hasSupabase) {
    try {
      await persist(body, transcript, chapter);
    } catch (e) {
      console.error("persist failed:", (e as Error).message);
    }
  }

  const result: GenerateResult = {
    transcript,
    chapter,
    mocked: { transcript: transcriptMocked, chapter: chapterMocked },
  };
  return NextResponse.json(result);
}

async function persist(body: Body, transcript: Transcript, chapter: Chapter) {
  const db = supabaseAdmin();

  const { data: project } = await db
    .from("project")
    .insert({ name: body.projectName || "Untitled memoir" })
    .select("id")
    .single();
  const projectId = project?.id;

  const { data: recording } = await db
    .from("recording")
    .insert({
      project_id: projectId,
      audio_path: body.audioPath ?? null,
      status: "ready",
    })
    .select("id")
    .single();
  const recordingId = recording?.id;

  await db
    .from("transcript")
    .insert({ recording_id: recordingId, segments: transcript.segments });

  const { data: chap } = await db
    .from("chapter")
    .insert({
      recording_id: recordingId,
      topic: chapter.topic,
      title: chapter.title,
      prose: chapter.prose,
      style_params: chapter.style_params,
      status: "draft",
    })
    .select("id")
    .single();
  const chapterId = chap?.id;

  // Entities + links — the cross-chapter "connections".
  for (const ent of chapter.entities) {
    const { data: e } = await db
      .from("entity")
      .insert({ project_id: projectId, type: ent.type, name: ent.name })
      .select("id")
      .single();
    if (e?.id && chapterId) {
      await db
        .from("chapter_entity")
        .insert({ chapter_id: chapterId, entity_id: e.id });
    }
  }
}
