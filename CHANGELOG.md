---
claud_doc_uuid: 637d64aa-2662-4410-a4cc-da0289dc87e3
---

# Changelog

## [Unreleased]
### Added
- Audio/video upload + transcription via ElevenLabs Scribe v2 with speaker diarization; ElevenLabs and Qwen API key fields (stored in localStorage).
- Real microphone recording (outside debug mode) via `MediaRecorder`, transcribed through ElevenLabs Scribe v2; debug mode keeps the mock transcript.
- Editable transcript with per-speaker renaming (rename applies to every line; lines are inline-editable).
- Qwen (DashScope, `qwen3.6-max-preview`) for theme-level topic detection and memoir chapter ghostwriting (with generated title); local keyword detection and raw-transcript fallbacks when no Qwen key.
- Qwen-powered "Polish" of the chapter draft (replaces the previous mock polish note).
- Supabase persistence (via CDN client + `config.js`): recordings/transcripts, approved chapters, and parking-lot topics are saved and reloaded on startup. Sidebar Recordings panel lists stored sessions and reopens them. Schema in `supabase-schema.sql`.
- Debug mode: load a transcript file (`.md`/`.txt`) with no STT API call. Handles both `Speaker N` format and free-text Q&A interviews. Includes a hardcoded "Load example interview" sample for testing Qwen without ElevenLabs.
### Changed
- Detected topics come from the transcript content (Qwen when available, else local keyword frequency) instead of a hardcoded dummy list.
- "Write chapter" generates the draft with Qwen instead of inserting a mock draft.
### Fixed
### Removed
- Unused mock chapter drafts and the mock "polish" suffix.
### Security
- AI keys (ElevenLabs/Qwen) live client-side (browser/localStorage); demo/hackathon only — proxy through a backend for production.
- Supabase anon key in `config.js` (gitignored); data is guarded by permissive RLS policies — tighten before production.

## [0.2.0] - 2026-06-06
### Added
- Persistent sidebar nav with Chapters, Recordings, Parking lot, and Settings entry points (SVG icons, badge counts).
- Chapters list in sidebar: each approved chapter appears as a numbered item; clicking navigates back to it.
- Parking lot syncs to sidebar panel — topics parked during review appear under "Parking lot".
- Horizontal step breadcrumb in workspace topbar showing flow position (Start → Recording → Transcript → Review → Chapter).
- "Do you know what you want to talk about?" modal on record button click — "Yes" goes straight to recording, "Rough idea" shows topic picker with questions displayed subtly during recording.
- Transcript screen redesigned as speaker-labeled transcript (Speaker 1 / Speaker 2) with pure line-by-line formatting.
- Notes for future recordings section on review screen — free-text input + "Park topic" button (Enter also submits).
### Removed
- Voice fingerprint panel from review screen.
- Glanceable prompts panel from recording screen.
- "One recording. One chapter." branding tagline from sidebar (replaced by nav structure).

## [0.1.0] - 2026-06-06
### Added
- Created a static frontend-only Memoir AI v1 demo with mocked recording, transcript, topic selection, chapter review, read-only chapter, and voice fingerprint concept panels.
- Added README instructions and documented that all backend, API, and microphone behavior is mocked.
