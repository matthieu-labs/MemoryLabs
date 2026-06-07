import { NextResponse } from "next/server";
import { transcribe, hasElevenLabs } from "@/lib/elevenlabs";
import { extractIntro } from "@/lib/pipeline";
import { hasQwen } from "@/lib/qwen";
import {
  supabaseAdmin,
  hasSupabase,
  RECORDINGS_BUCKET,
} from "@/lib/supabase";
import { MOCK_INTRO_TRANSCRIPT, MOCK_INTRO } from "@/lib/mock";
import type { Transcript, IntroResult, OnboardResult } from "@/lib/types";

export const maxDuration = 60;

interface Body {
  audioPath?: string;
  audioUrl?: string;
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* empty → full mock */
  }

  // 1) Resolve audio URL or fall back to a mock intro transcript.
  let audioUrl = body.audioUrl;
  if (!audioUrl && body.audioPath && hasSupabase) {
    const { data } = supabaseAdmin()
      .storage.from(RECORDINGS_BUCKET)
      .getPublicUrl(body.audioPath);
    audioUrl = data.publicUrl;
  }

  let transcript: Transcript;
  let transcriptMocked = false;
  try {
    if (audioUrl && hasElevenLabs) {
      transcript = await transcribe(audioUrl);
    } else {
      transcript = MOCK_INTRO_TRANSCRIPT;
      transcriptMocked = true;
    }
  } catch (e) {
    return NextResponse.json(
      { error: `Transcription failed: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  // 2) Extract the family graph.
  let intro: IntroResult;
  let introMocked = false;
  try {
    if (hasQwen) {
      intro = await extractIntro(transcript);
    } else {
      intro = MOCK_INTRO;
      introMocked = true;
    }
  } catch (e) {
    return NextResponse.json(
      { error: `Family extraction failed: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  const result: OnboardResult = {
    transcript,
    intro,
    mocked: { transcript: transcriptMocked, intro: introMocked },
  };
  return NextResponse.json(result);
}
