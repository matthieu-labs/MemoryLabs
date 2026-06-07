---
claud_doc_uuid: 24338fe5-f00f-4d0b-8c5d-413128414432
---

# MemoryLabs — Memoir AI

AI Hackathon · Hamburg

Record a conversation with a grandparent → get a memoir **chapter written in
their own voice**. Mobile-first web app (installable PWA).

## Stack

| Layer | Choice |
|-------|--------|
| App | **Next.js** (App Router, TS) — frontend + API routes, deploy on Vercel |
| Transcription | **ElevenLabs Scribe** — diarized, language auto-detected |
| LLM pipeline | **Qwen** via Alibaba DashScope (OpenAI-compatible API) |
| Storage / history | **Supabase** — Postgres + Storage |
| Install | PWA (manifest + service worker) → works in any mobile browser |

## The pipeline (`lib/pipeline.ts`)

```
audio → ElevenLabs Scribe (diarized) → split Interviewer / Subject
      → [Qwen] summarise subject turns  (anti-hallucination + word bank + entities)
      → [Qwen] structure into outline + style params
      → [Qwen] write chapter, first person, in the transcript's own language
      → Supabase (transcript, chapter, entities → cross-chapter links)
```

## Run locally

```bash
npm install
cp .env.local.example .env.local   # fill in keys (optional — see below)
npm run dev                        # http://localhost:3000
```

**No keys?** The app still runs the full UI on mocked transcript + chapter,
so you can build the frontend before providers are wired up. A "Demo data"
badge shows when mocks are in use.

## Wiring real providers

1. **Supabase** — create a project, run `supabase/schema.sql` in the SQL
   editor, create a Storage bucket named `recordings`. Put the URL + keys in
   `.env.local`.
2. **DashScope (Qwen)** — set `DASHSCOPE_API_KEY`. Confirm the region base URL
   (international vs Beijing) in `.env.local.example`.
3. **ElevenLabs** — set `ELEVENLABS_API_KEY`.

Each provider degrades independently: missing Qwen → mock chapter; missing
ElevenLabs → mock transcript; missing Supabase → no history saved.

## Mobile recording notes

- Recording uses `MediaRecorder` (iOS Safari 14.3+, Android Chrome) — needs
  **HTTPS** + a user tap. Vercel provides HTTPS.
- `Or upload an audio file` is the stage-proof fallback (opens the phone's
  native recorder via `capture`).
- Audio uploads **directly to Supabase Storage** from the browser; the API
  route only gets a path — avoids Vercel's request-body size limit.

## Layout

```
app/            page.tsx (flow) · layout.tsx · api/generate/route.ts · globals.css
components/     useRecorder.ts · RegisterSW.tsx
lib/            pipeline.ts · qwen.ts · elevenlabs.ts · supabase.ts · types.ts · mock.ts
supabase/       schema.sql
public/         manifest.webmanifest · sw.js · icon.svg
Planning/       product brainstorm + v1 scope (source of truth)
design-explorations/  UI direction mockups (parked)
legacy-static/  original static HTML demo (reference only)
```

## Scope Source

`Planning/scope-v1.md` and `Planning/product-brainstorm-transcript-summary.md`.
