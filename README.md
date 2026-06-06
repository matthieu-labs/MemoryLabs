---
claud_doc_uuid: 24338fe5-f00f-4d0b-8c5d-413128414432
---

# MemoryLabs

AI Hackathon 6th of June - Hamburg

## Memoir AI v1 Frontend Mock

Static, frontend-only demo for the v1 MemoryLabs / Memoir AI scope.

## What It Does

- Simulates the start, recording, stop, topic selection, chapter review, and read-only chapter flow.
- Uses mocked transcript, topic detection, chapter generation, and voice fingerprint data.
- Does not request microphone access.
- Does not call APIs.
- Does not require a backend, build step, package install, or dev server.

## Run

1. Copy `config.example.js` to `config.js` and paste your Supabase **Project URL** and **anon public key** (Supabase → Settings → API).
2. In the Supabase SQL editor, run `supabase-schema.sql` once to create the tables.
3. Open `index.html` in a browser.

`config.js` is gitignored. The anon key is safe to ship to the browser — data is protected by Row Level Security, not by hiding the key. AI keys (ElevenLabs / Qwen) are still entered in the UI and saved in `localStorage`.

## Deploy on Netlify (judges test without API keys)

The app can be hosted on Netlify with the AI keys living **server-side**, so anyone can use the live site without supplying their own ElevenLabs / Qwen keys.

1. Connect this repo to Netlify (or `netlify deploy`). `netlify.toml` already sets publish dir, functions dir, and the build step.
2. In **Site settings → Environment variables**, add:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` — public; used by the browser (the build writes them into `config.js`).
   - `ELEVENLABS_API_KEY`, `QWEN_API_KEY` — secret; used only by the serverless functions, never sent to the browser.
3. Deploy. The functions `netlify/functions/transcribe` and `netlify/functions/qwen` proxy the AI APIs.

On the hosted site, leave the API-key fields blank — calls go through the functions. The key fields only matter for local `file://` use. (Netlify functions cap request bodies near 6 MB, so use short clips for the live demo.)

## Persistence (Supabase)

Recordings/transcripts, approved chapters, and parking-lot topics are stored in Supabase and reloaded on startup. Tables: `recordings`, `chapters`, `parked_topics` (see `supabase-schema.sql`). If `config.js` is missing or unfilled, the app still runs but nothing persists (a console warning is logged).

## Scope Source

Built from the v1 flow described in:
https://github.com/matthieu-labs/MemoryLabs/blob/main/Planning/scope-v1.md
