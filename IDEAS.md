# Memoir AI — ideas & vision

Ideas raised during the session (author: d.shemendyuk). Grouped by theme; the
status shows what is already built in the `ui-prototype` branch.

Legend: ✅ done · 🟡 partial · ⬜ not yet · 🔧 technical decision

---

## Vision / product
- ✅ Turn the example into a **production-ready** direction with a new, better UI.
- 🟡 Several UI versions/directions (main one done; one alternative mockup in
  `design-explorations/`; directions B/C not yet).

## Onboarding → family tree
- ✅ After install, the user **records their own first intro** — when and where
  they were born, who their relatives are, their children.
- ✅ After recording, the app **highlights the recognized names** and builds a
  **basic family tree** that can be extended.
- ✅ This is **not "projects" but a family tree** that gets filled in; renamed to
  Family / Person / **Story**.
- 🟡 Each person acts like a "project": you can **create a chat and add notes**.
  (The Story node and its conversations exist; **chat + notes — not yet**.)

## Tree / persona
- ✅ Persona clarification: the user is a **person aged 30–40** collecting their
  grandparents' stories (recording them, or playing them voice-notes with
  questions) — **not the subject** themselves.
- ✅ Show that **"I" am in the middle of the tree** (ancestors above, descendants
  below); the tree **scrolls**, centered on load.
- ✅ **Number of recordings per person — as a bubble** on the node, very compact.
- ✅ **Topics/tags in a person's profile** — "All" + the specific detected topics
  (filter the conversations).

## Recording / chapter
- ✅ **Persistent new-recording button** on every screen (FAB), no clash with the
  logo, **no label** (circular with a record dot), starts recording immediately.
- ✅ **Pause** during recording.
- ✅ After recording, **Approve and tags are fixed and visible** (sticky action
  bar).
- ✅ If a recording **isn't tied to a story — propose** where to save it; default
  is the **personal** story (the owner).
- 🟡 **Propose recognized names** for the tree — present after generation
  ("New people we heard"); **live during transcription — not yet**.

## Voice (recognition)
- 🟡 **Remember the user's voice** and **tell them apart across calls**; remember
  multiple call participants. (Within-call diarization is in the pipeline concept;
  **cross-call voiceprint — not yet**, a stretch: Picovoice Eagle / pyannote.)

## Mobile / workflow
- ✅ Must **work on mobile** (browser or app — doesn't matter) → built as a
  **mobile-first PWA**.
- ✅ **Fake recording locally** instead of a mic error (for dev work).
- ✅ A separate **`ui-prototype` branch** — UI only, no technical changes.

## Technical decisions (from discussions)
- 🔧 Transcription — **ElevenLabs Scribe** (diarization, auto language).
- 🔧 LLM — **Qwen** via DashScope (cloud, `qwen-max`).
- 🔧 Store the whole history — **Supabase**.
- 🔧 **Auto language detection** (no hardcoding; the chapter is written in the
  transcript's language).

---

## Backlog (next steps from the ideas)
1. ⬜ Chat + notes inside each Story.
2. ⬜ Manually add a person to the tree.
3. ⬜ Live recognized-name suggestions **during** transcription.
4. ⬜ Voiceprint: recognize a person across calls + multiple participants.
5. ⬜ Additional design directions (B/C) for the tree/chapters.

> Implementation details and the optional technical stack are in `HANDOFF.md`
> (on the `ui-prototype` branch).
