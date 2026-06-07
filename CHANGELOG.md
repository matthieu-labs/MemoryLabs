---
claud_doc_uuid: 637d64aa-2662-4410-a4cc-da0289dc87e3
---

# Changelog

## [Unreleased]
### Added
### Changed
### Fixed
### Removed
### Security

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
