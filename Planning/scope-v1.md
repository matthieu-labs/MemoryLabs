---
claud_doc_uuid: pending
claud_doc_uuid: ce93d262-4b3e-4d9c-98e0-293555540975
---

# Memoir AI — Hackathon Scope: What We're Building

**Date**: 2026-06-06  
**Deadline**: Today 7 PM  
**Status**: Agreed — go build

---

## Platform Decision: Web App

**Decision: Web first. No native mobile app.**

Rationale:
- Review flow, chapter editing, and reading the output need a real screen — too cumbersome on phone
- Grandfather can't use a small phone UI for review
- Building both web + app = 60% of each, not 80% of one
- Workaround for recording friction: phone records (frictionless, face-down on table), web handles everything else
- If time allows: simulate an app UI as a wireframe in the pitch deck (no need to actually build it)

---

## The Core Flow (v1 — Build This)

```
[Start] → Press "Start Recording"
         ↓
[Record] → Phone / laptop mic on, minimal UI, can be face-down
         ↓
[Stop]  → Press stop, see elapsed time
         ↓
[Topics] → AI detects what was discussed, shows topic list
         → User picks: "Write a chapter about: school"
         ↓
[Chapter] → AI writes chapter in interviewee's voice, ignores off-topic content
         ↓
[Review] → Moderator reads chapter in web UI, approves / edits
```

---

## What Each Screen Looks Like

### Screen 1 — Start
- Project name input (optional for v1)
- One big button: **Start Recording**
- Optional: collapsible list of question ideas (user can ignore)

### Screen 2 — Recording
- Elapsed time counter
- Minimal noise — screen can sit on the table
- Optional visible: question list the user can glance at
- **Stop** button

### Screen 3 — Topic Selection
- After stopping: AI shows detected topics from the recording
  - Example: "This conversation covered: school (primary), honeymoon, family relationships"
- User picks one topic for the first chapter
- CTA: "Write chapter about [topic]"

### Screen 4 — Chapter Review
- Chapter text displayed in web UI
- Larger text, clean layout — grandfather-friendly
- Moderator can read through with grandfather
- Basic approval / edit flow

---

## Voice Fingerprint — v1 vs v2

| Feature | v1 (build now) | v2 (later) |
|---------|---------------|-----------|
| Speaker diarization | Yes — split moderator vs. interviewee audio | — |
| Extract tone of voice from interviewee | Yes — baseline voice profile | — |
| Write chapter in interviewee's voice | Yes | — |
| Self-improving from feedback | No | Yes — "good" → "amazing" style corrections update the profile |

**v1 voice fingerprint**: After the first chapter, produce a tone-of-voice draft file for the interviewee. This file is used to generate subsequent chapters consistently.

---

## What Is Explicitly OUT of v1

- Native mobile app
- Push notifications
- Family context onboarding / family tree input
- Chapter tree visualisation
- Multiple chapters from one recording session
- Source tracing (audio → sentence link)
- Self-improving voice fingerprint
- Children's book / audiobook outputs

These go into the pitch deck as vision slides — we mention them but do not build them.

---

## What the Pitch Assumes

- One recording session → one topic → one chapter draft
- Voice fingerprint is created after first chapter (shown as a concept)
- Review happens on web UI
- Physical/digital book output is implied but not demoed live
- App wireframe / phone mockup shown as "future state"

---

## Build Order

1. **Recording** — web-based audio recorder, uploads to server
2. **Transcription** — Whisper or equivalent on backend
3. **Topic detection** — LLM extracts topics, returns list
4. **Chapter generation** — LLM writes chapter for selected topic, in interviewee's voice
5. **Review UI** — display chapter, basic read-through flow
6. *(If time)* — Voice fingerprint file visible in UI

---

*Saved: 2026-06-06 | Source: recorded scope alignment conversation, AI Beavers Hackathon Hamburg*
