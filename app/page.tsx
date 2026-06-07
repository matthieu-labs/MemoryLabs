"use client";

import { useState, useEffect, useRef } from "react";
import { useRecorder, ext } from "@/components/useRecorder";
import { supabaseBrowser, hasSupabaseClient } from "@/lib/supabaseClient";
import { RECORDINGS_BUCKET } from "@/lib/constants";
import {
  getProject,
  addRecording,
  updateRecordingAudio,
  loadAllRecordings,
  recordingName,
  formatDuration,
  type StoredRecording,
  type AudioMeta,
  type RecordingWithPerson,
} from "@/lib/store";
import { putAudio } from "@/lib/audioStore";
import { getCurrentCoords, reverseGeocode, type Coords } from "@/lib/geo";
import AudioNote from "@/components/AudioNote";
import {
  loadFamily,
  hasFamily,
  createFamilyFromIntro,
  addPerson,
  RELATION_LABEL,
  type Family,
} from "@/lib/family";
import type { GenerateResult, OnboardResult, Relation } from "@/lib/types";

type Screen =
  | "welcome"
  | "intro-record"
  | "intro-processing"
  | "reveal"
  | "family"
  | "recording"
  | "processing"
  | "chapter"
  | "story"
  | "recordings"
  | "articles";

const INTRO_PROMPTS = [
  "When and where were you born?",
  "Your parents' names?",
  "Brothers and sisters?",
  "Your partner?",
  "Your children and grandchildren?",
];

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [recordMode, setRecordMode] = useState<"chapter" | "intro">("intro");
  const [projectName, setProjectName] = useState("");
  const [topic] = useState("School");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [onboard, setOnboard] = useState<OnboardResult | null>(null);
  const [activePerson, setActivePerson] = useState<string | null>(null);
  const [assignTo, setAssignTo] = useState<string>("");
  const [topicFilter, setTopicFilter] = useState<string>("All");
  // Where the chapter detail was opened from, so "Back" returns there.
  const [detailFrom, setDetailFrom] = useState<Screen>("story");
  const [detailPerson, setDetailPerson] = useState<string | null>(null);
  const rec = useRecorder();
  const ownerRef = useRef<HTMLButtonElement>(null);
  // Audio + capture metadata for the chapter currently being generated.
  const lastBlobRef = useRef<Blob | null>(null);
  const lastAudioUrlRef = useRef<string | null>(null);
  const lastDurationRef = useRef<number | null>(null);
  const coordsRef = useRef<Coords | null>(null);

  // Keep "you" centered in the tree by default (ancestors above, descendants
  // below) — but the tree stays scrollable.
  useEffect(() => {
    if ((screen === "family" || screen === "reveal") && ownerRef.current) {
      ownerRef.current.scrollIntoView({ block: "center" });
    }
  }, [screen, family]);

  useEffect(() => {
    const f = loadFamily();
    setFamily(f);
    if (f?.owner.name) setProjectName(f.owner.name);
    setScreen(hasFamily() ? "family" : "welcome");
    setReady(true);
  }, []);

  const isDev = process.env.NODE_ENV !== "production";

  async function uploadAudio(blob: Blob, fileExt: string): Promise<string | null> {
    if (!hasSupabaseClient || !supabaseBrowser) return null;
    const path = `rec-${Date.now()}.${fileExt}`;
    const bucket = supabaseBrowser.storage.from(RECORDINGS_BUCKET);
    const { error } = await bucket.upload(path, blob, {
      contentType: blob.type,
      upsert: true,
    });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    // Keep the public URL so the saved recording can be played back remotely.
    lastAudioUrlRef.current = bucket.getPublicUrl(path).data?.publicUrl ?? null;
    return path;
  }

  async function beginRecording(mode: "chapter" | "intro") {
    setRecordMode(mode);
    setResult(null);
    setErrorMsg(null);
    // Best-effort: note where the conversation is being recorded.
    coordsRef.current = null;
    if (mode === "chapter") getCurrentCoords().then((c) => (coordsRef.current = c));
    try {
      await rec.start();
      setScreen("recording");
    } catch {
      if (isDev) {
        rec.startSimulated();
        setScreen("recording");
      } else {
        setScreen(mode === "intro" ? "welcome" : "story");
      }
    }
  }

  async function onStop() {
    // Capture the elapsed length before stop() tears the timer down.
    lastDurationRef.current = recordMode === "chapter" ? rec.seconds : null;
    const blob = await rec.stop();
    const fileExt = ext(blob?.type || "audio/webm");
    // Remember the audio so we can save it with the chapter on approval.
    lastBlobRef.current = recordMode === "chapter" ? blob : null;
    lastAudioUrlRef.current = null;
    if (recordMode === "intro") await processIntro(blob, fileExt);
    else await processChapter(blob, fileExt);
  }

  async function cancelRecording() {
    await rec.stop(); // discard the recording
    setResult(null);
    setErrorMsg(null);
    if (recordMode === "intro") {
      setScreen(hasFamily() ? "family" : "welcome");
    } else {
      setScreen(activePerson ? "story" : hasFamily() ? "family" : "welcome");
    }
  }

  async function processIntro(blob: Blob | null, fileExt: string) {
    setScreen("intro-processing");
    setErrorMsg(null);
    try {
      let audioPath: string | null = null;
      if (blob) audioPath = await uploadAudio(blob, fileExt);
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioPath }),
      });
      const data = (await res.json()) as OnboardResult & { error?: string };
      if (!res.ok) throw new Error(data.error || "Onboarding failed");
      const fam = createFamilyFromIntro(data.intro);
      setFamily(fam);
      setOnboard(data);
      if (fam.owner.name) setProjectName(fam.owner.name);
      setScreen("reveal");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setScreen("welcome");
    }
  }

  async function processChapter(blob: Blob | null, fileExt: string) {
    setScreen("processing");
    setErrorMsg(null);
    try {
      let audioPath: string | null = null;
      if (blob) audioPath = await uploadAudio(blob, fileExt);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, topic, audioPath }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      // Don't save yet — let the user confirm which Story it belongs to.
      setResult(data as GenerateResult);
      setReadOnly(false);
      setAssignTo(activePerson || family?.owner.name || "Personal");
      setScreen("chapter");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setScreen("story");
    }
  }

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileExt = file.name.split(".").pop() || "webm";
    lastBlobRef.current = recordMode === "chapter" ? file : null;
    lastAudioUrlRef.current = null;
    if (recordMode === "intro") processIntro(file, fileExt);
    else processChapter(file, fileExt);
  }

  function goHome() {
    setActivePerson(null);
    setScreen(hasFamily() ? "family" : "welcome");
  }
  function goRecordings() {
    setActivePerson(null);
    setScreen("recordings");
  }
  function goArticles() {
    setActivePerson(null);
    setScreen("articles");
  }
  function openPerson(name: string) {
    setActivePerson(name);
    setProjectName(name);
    setTopicFilter("All");
    setScreen("story");
  }
  function viewRecording(
    r: StoredRecording,
    from: Screen = "story",
    person: string | null = activePerson
  ) {
    setResult(r);
    setReadOnly(true);
    setDetailFrom(from);
    setDetailPerson(person);
    setScreen("chapter");
  }
  async function approveChapter() {
    const target = assignTo || family?.owner.name || "Personal";
    if (result) {
      const blob = lastBlobRef.current;
      const remoteUrl = lastAudioUrlRef.current;
      // Pick the best available source: remote URL > captured blob > demo sample.
      const audio: AudioMeta = remoteUrl
        ? { kind: "remote", url: remoteUrl }
        : blob
        ? { kind: "local" }
        : { kind: "sample" };
      // Resolve where it was recorded (best-effort; never blocks for long).
      const place = coordsRef.current
        ? (await reverseGeocode(coordsRef.current)) ?? undefined
        : undefined;
      const rec = addRecording(target, result, {
        audio,
        durationSec: lastDurationRef.current ?? undefined,
        place,
      });
      if (audio.kind === "local" && blob) {
        try {
          await putAudio(rec.id, blob);
          updateRecordingAudio(target, rec.id, { kind: "local", url: rec.id });
        } catch {
          updateRecordingAudio(target, rec.id, { kind: "sample" });
        }
      }
    }
    lastBlobRef.current = null;
    lastAudioUrlRef.current = null;
    lastDurationRef.current = null;
    coordsRef.current = null;
    openPerson(target);
  }
  function addToFamily(name: string) {
    addPerson(name, "other");
    setFamily(loadFamily());
  }

  // People mentioned in the chapter who aren't in the family yet.
  function newPeople(): string[] {
    if (!result) return [];
    const known = new Set<string>();
    if (family) {
      known.add((family.owner.name || "").toLowerCase());
      family.people.forEach((p) => known.add(p.name.toLowerCase()));
    }
    return result.chapter.entities
      .filter((e) => e.type === "person")
      .map((e) => e.name)
      .filter((n) => n && !known.has(n.toLowerCase()));
  }

  // Stories the chapter can be filed under.
  function storyOptions(): string[] {
    const names: string[] = [];
    if (family?.owner.name) names.push(family.owner.name);
    family?.people.forEach((p) => names.push(p.name));
    if (assignTo && !names.includes(assignTo)) names.unshift(assignTo);
    if (names.length === 0) names.push("Personal");
    return names;
  }

  const activeRecordings = activePerson
    ? getProject(activePerson)?.recordings ?? []
    : [];
  // Topics we detected for this person (chapter topics across their conversations).
  const personTopics = Array.from(
    new Set(activeRecordings.map((r) => r.chapter.topic).filter(Boolean))
  );
  const filteredRecordings =
    topicFilter === "All"
      ? activeRecordings
      : activeRecordings.filter((r) => r.chapter.topic === topicFilter);
  // The "new recording" FAB lives on every browse/read screen — everywhere
  // except an active recording and the transient onboarding/processing steps.
  // Hidden on the chapter generation preview too, where it would overlap the
  // fixed action bar.
  const showFab =
    ready &&
    !!family &&
    (screen === "family" ||
      screen === "story" ||
      screen === "recordings" ||
      screen === "articles" ||
      (screen === "chapter" && readOnly));

  // ─── Family tree renderer (shared by reveal + family home) ───
  // Genealogical order: ancestors above "you", descendants below. "You" sits
  // in the middle (you're the one collecting your family's stories).
  function renderTree(f: Family) {
    const byRelation: Record<string, typeof f.people> = {};
    for (const p of f.people) (byRelation[p.relation] ??= []).push(p);

    const recCount = (name: string) =>
      getProject(name)?.recordings.length ?? 0;

    const group = (rel: Relation) => {
      const people = byRelation[rel];
      if (!people || people.length === 0) return null;
      return (
        <div className="relation-group" key={rel}>
          <span className="relation-label">{RELATION_LABEL[rel]}</span>
          <div className="person-row">
            {people.map((p) => {
              const n = recCount(p.name);
              return (
                <button
                  key={p.id}
                  className="person-chip"
                  onClick={() => openPerson(p.name)}
                >
                  <span className="person-avatar" aria-hidden>
                    {p.name.charAt(0)}
                  </span>
                  <span className="person-name">{p.name}</span>
                  {n > 0 && (
                    <span className="rec-count" title={`${n} conversations`}>
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="tree">
        {/* Ancestors — above you */}
        {group("grandparent")}
        {group("parent")}

        {/* You — the centre of the tree */}
        <div className="relation-group">
          <span className="relation-label">You</span>
          <button
            ref={ownerRef}
            className="owner-card"
            onClick={() => openPerson(f.owner.name || "You")}
          >
            <span className="owner-avatar" aria-hidden>
              {(f.owner.name || "Y").charAt(0)}
            </span>
            <span className="owner-name">{f.owner.name || "You"}</span>
            {(f.owner.bornYear || f.owner.bornPlace) && (
              <span className="owner-meta">
                {[f.owner.bornPlace, f.owner.bornYear].filter(Boolean).join(" · ")}
              </span>
            )}
            {recCount(f.owner.name || "You") > 0 && (
              <span className="owner-count">
                {recCount(f.owner.name || "You")} conversation
                {recCount(f.owner.name || "You") === 1 ? "" : "s"}
              </span>
            )}
          </button>
        </div>

        {/* Peers */}
        {group("sibling")}
        {group("spouse")}

        {/* Descendants — below you */}
        {group("child")}
        {group("grandchild")}
        {group("other")}
      </div>
    );
  }

  if (!ready) return <main className="app" />;

  // When a chapter is opened from the Recordings tab we treat it as a voice note:
  // audio + transcript lead, the written article is collapsed underneath.
  const recordingView = readOnly && detailFrom === "recordings";
  const transcriptLines = result?.transcript.segments.map((s, i) => (
    <div className="tline" key={i}>
      <span className={`tspk ${s.speaker}`}>
        {s.speaker === "subject" ? "Them" : "You"}
      </span>
      <span className="ttext">{s.text}</span>
    </div>
  ));
  const proseParas = result?.chapter.prose
    .split(/\n{2,}/)
    .map((p, i) => <p key={i}>{p}</p>);
  const entityChips =
    result && result.chapter.entities.length > 0 ? (
      <div className="chips" style={{ marginTop: 18 }}>
        {result.chapter.entities.map((e, i) => (
          <span className="chip" key={i}>{e.name}</span>
        ))}
      </div>
    ) : null;
  const backToOrigin = () =>
    detailFrom === "story" && detailPerson
      ? openPerson(detailPerson)
      : setScreen(detailFrom);

  return (
    <main className="app">
      <header className="appbar">
        <button className="brand-btn" onClick={goHome} aria-label="Family tree (home)" title="Family tree">
          <span className="mark" aria-hidden />
          <span className="name">Memorylab</span>
        </button>
        <span className="spacer" />
        {family && ["family", "recordings", "articles", "story"].includes(screen) && (
          <nav className="tabs" aria-label="Sections">
            <button
              className={`tab${screen === "recordings" ? " on" : ""}`}
              onClick={goRecordings}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="9" y="2.5" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
              <span>Recordings</span>
            </button>
            <button
              className={`tab${screen === "articles" ? " on" : ""}`}
              onClick={goArticles}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 3h9l5 5v13H5z" />
                <path d="M14 3v5h5M8.5 13h7M8.5 17h7" />
              </svg>
              <span>Articles</span>
            </button>
          </nav>
        )}
      </header>

      {/* ─── WELCOME ─── */}
      {screen === "welcome" && (
        <section className="screen center">
          <p className="eyebrow">Welcome</p>
          <h1 className="lead">Start with your own story.</h1>
          <p className="sub">
            Record a short introduction — who you are, where you come from, and
            the people in your family. We&apos;ll turn it into the first branches
            of your family tree.
          </p>
          <button
            className="record-btn"
            onClick={() => beginRecording("intro")}
            aria-label="Record your introduction"
          >
            <span className="dot" />
          </button>
          <p className="record-hint">Record your introduction</p>
          {errorMsg && <p className="error-banner">{errorMsg}</p>}
          <label className="upload-link">
            Or upload an audio file
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                setRecordMode("intro");
                onUpload(e);
              }}
            />
          </label>
        </section>
      )}

      {/* ─── RECORDING (intro or chapter) ─── */}
      {screen === "recording" && (
        <section className="screen center">
          <p className="eyebrow">
            {recordMode === "intro" ? "About you" : `Recording · ${projectName}`}
            {rec.paused && " · paused"}
          </p>
          <div className={`pulse${rec.paused ? " paused" : ""}`} aria-hidden />
          <div className="timer">{fmtTime(rec.seconds)}</div>
          <div className="btn-row" style={{ width: "100%", maxWidth: 360 }}>
            <button
              className="btn btn-ghost"
              onClick={() => (rec.paused ? rec.resume() : rec.pause())}
            >
              {rec.paused ? "Resume" : "Pause"}
            </button>
            <button className="btn btn-stop" onClick={onStop}>
              <span className="sq" />{" "}
              {recordMode === "intro" ? "Build my tree" : "Create chapter"}
            </button>
          </div>
          <button
            className="back-link"
            onClick={cancelRecording}
            style={{ marginTop: 16, alignSelf: "center" }}
          >
            Cancel
          </button>
          {recordMode === "intro" && (
            <ul className="prompt-list">
              {INTRO_PROMPTS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {rec.simulated && (
            <p className="record-hint" style={{ marginTop: 14 }}>
              Demo recording (no mic in local dev) — Stop uses a sample.
            </p>
          )}
        </section>
      )}

      {/* ─── INTRO PROCESSING ─── */}
      {screen === "intro-processing" && (
        <section className="screen center">
          <div className="spinner" aria-hidden />
          <h2 style={{ marginBottom: 16 }}>Building your family tree…</h2>
          <div className="steps-mini">
            <div className="on">Transcribing your introduction</div>
            <div>Finding the people you mentioned</div>
            <div>Drawing the first branches</div>
          </div>
        </section>
      )}

      {/* ─── REVEAL ─── */}
      {screen === "reveal" && family && (
        <section className="screen">
          {onboard?.mocked &&
            (onboard.mocked.transcript || onboard.mocked.intro) && (
              <div className="banner">
                {onboard.mocked.transcript
                  ? "Built from a sample intro — add an ElevenLabs key to use your real recording."
                  : "Demo extraction — add a Qwen key for real."}
              </div>
            )}
          <p className="eyebrow">Your family, remembered</p>
          <h1 className="lead-sm">
            We found {family.people.length}{" "}
            {family.people.length === 1 ? "person" : "people"}.
          </h1>
          <p className="sub" style={{ margin: "6px 0 8px" }}>
            Tap anyone to start their story. You can add more anytime.
          </p>
          {renderTree(family)}
          <div className="divider-soft" />
          <button className="btn btn-primary" onClick={() => setScreen("family")}>
            This looks right
          </button>
        </section>
      )}

      {/* ─── FAMILY (home tree) ─── */}
      {screen === "family" && family && (
        <section className="screen">
          <p className="eyebrow">Your family</p>
          <h1 className="lead-sm">
            {family.owner.name ? `${family.owner.name}'s family` : "Your family"}
          </h1>
          {renderTree(family)}
        </section>
      )}

      {/* ─── PROCESSING (chapter) ─── */}
      {screen === "processing" && (
        <section className="screen center">
          <div className="spinner" aria-hidden />
          <h2 style={{ marginBottom: 16 }}>Writing the chapter…</h2>
          <div className="steps-mini">
            <div className="on">Transcribing the conversation</div>
            <div>Distilling what was said</div>
            <div>Writing in their voice</div>
          </div>
        </section>
      )}

      {/* ─── STORY (one person's recordings) ─── */}
      {screen === "story" && activePerson && (
        <section className="screen">
          <button className="back-link" onClick={goHome}>‹ Family</button>
          <h1 className="lead-sm">{activePerson}&apos;s Story</h1>
          <p className="sub" style={{ margin: "6px 0 18px" }}>
            {activeRecordings.length} conversation
            {activeRecordings.length === 1 ? "" : "s"}.
          </p>
          <button className="btn btn-primary" onClick={() => beginRecording("chapter")}>
            {activeRecordings.length === 0
              ? "Record a conversation"
              : "Continue — new recording"}
          </button>
          {errorMsg && <p className="error-banner">{errorMsg}</p>}

          {/* Topics we detected for this person */}
          {personTopics.length > 0 && (
            <div className="topic-filter">
              <button
                className={`topic-pill${topicFilter === "All" ? " on" : ""}`}
                onClick={() => setTopicFilter("All")}
              >
                All
              </button>
              {personTopics.map((t) => (
                <button
                  key={t}
                  className={`topic-pill${topicFilter === t ? " on" : ""}`}
                  onClick={() => setTopicFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="card-list" style={{ marginTop: 16 }}>
            {[...filteredRecordings]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((r, idx, arr) => (
                <button key={r.id} className="card" onClick={() => viewRecording(r, "story", activePerson)}>
                  <div className="card-main">
                    <span className="card-eyebrow">
                      Ch. {arr.length - idx} · {r.chapter.topic}
                    </span>
                    <span className="card-title serif">{r.chapter.title}</span>
                    <span className="card-sub">{fmtDate(r.createdAt)}</span>
                  </div>
                  <span className="card-chevron" aria-hidden>›</span>
                </button>
              ))}
          </div>
        </section>
      )}

      {/* ─── RECORDINGS (all voice notes, chronological) ─── */}
      {screen === "recordings" && (
        <section className="screen">
          <h1 className="lead-sm">Recordings</h1>
          <p className="sub" style={{ margin: "6px 0 6px", maxWidth: "100%" }}>
            All voice notes, newest first.
          </p>
          {(() => {
            const all = loadAllRecordings();
            if (all.length === 0)
              return (
                <p className="sub" style={{ marginTop: 18, maxWidth: "100%" }}>
                  No recordings yet. Open the tree (the logo), pick someone, and
                  record a conversation.
                </p>
              );
            return (
              <div className="card-list" style={{ marginTop: 16 }}>
                {all.map(({ rec, person }) => {
                  const dur = formatDuration(rec.durationSec);
                  return (
                    <button
                      key={rec.id}
                      className="card"
                      onClick={() => viewRecording(rec, "recordings", person)}
                    >
                      <div className="card-main">
                        <span className="card-eyebrow">
                          {person}
                          {dur ? ` · ${dur}` : ""}
                        </span>
                        <span className="card-title serif">{recordingName(rec)}</span>
                        <span className="card-sub">Became: {rec.chapter.title}</span>
                      </div>
                      <span className="card-chevron" aria-hidden>›</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </section>
      )}

      {/* ─── ARTICLES (the book — chapters grouped by person) ─── */}
      {screen === "articles" && (
        <section className="screen">
          <h1 className="lead-sm">Articles</h1>
          <p className="sub" style={{ margin: "6px 0 6px", maxWidth: "100%" }}>
            The book, gathered from every story.
          </p>
          {(() => {
            const all = loadAllRecordings();
            if (all.length === 0)
              return (
                <p className="sub" style={{ marginTop: 18, maxWidth: "100%" }}>
                  No articles yet.
                </p>
              );
            const byPerson = new Map<string, RecordingWithPerson[]>();
            for (const item of all) {
              const list = byPerson.get(item.person) ?? [];
              list.push(item);
              byPerson.set(item.person, list);
            }
            return (
              <div style={{ marginTop: 12 }}>
                {[...byPerson.entries()].map(([person, items]) => (
                  <div key={person} className="article-group">
                    <span className="relation-label article-group-label">{person}</span>
                    <div className="card-list">
                      {items.map(({ rec }) => (
                        <button
                          key={rec.id}
                          className="card"
                          onClick={() => viewRecording(rec, "articles", person)}
                        >
                          <div className="card-main">
                            <span className="card-eyebrow">{rec.chapter.topic}</span>
                            <span className="card-title serif">{rec.chapter.title}</span>
                          </div>
                          <span className="card-chevron" aria-hidden>›</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>
      )}

      {/* ─── CHAPTER ─── */}
      {screen === "chapter" && result && (
        <section className={`screen${readOnly ? "" : " has-actionbar"}`}>
          {(result.mocked.transcript || result.mocked.chapter) && (
            <div className="banner">
              {result.mocked.transcript && result.mocked.chapter
                ? "Demo transcript + demo chapter — add ElevenLabs & Qwen keys for the real pipeline."
                : result.mocked.transcript
                ? "Real chapter from a demo transcript — add an ElevenLabs key to transcribe real audio."
                : "Demo chapter — add a Qwen (DASHSCOPE) key to generate for real."}
            </div>
          )}
          {readOnly && (
            <button className="back-link" onClick={backToOrigin}>
              ‹ {detailFrom === "recordings" ? "Recordings" : detailFrom === "articles" ? "Articles" : "Story"}
            </button>
          )}
          <p className="chapter-num">Chapter · {result.chapter.topic}</p>
          <h1 className="chapter-title">{result.chapter.title}</h1>

          {/* Voice-note view leads with the recording; article view tucks the
              player down beside "View transcript" instead. */}
          {recordingView && (
            <>
              <p className="chapter-meta">
                Voice note{detailPerson ? ` · ${detailPerson}` : ""}
                {" · "}
                {recordingName(result as StoredRecording)}
                {formatDuration((result as StoredRecording).durationSec)
                  ? ` · ${formatDuration((result as StoredRecording).durationSec)}`
                  : ""}
              </p>
              <AudioNote audio={(result as StoredRecording).audio} />
            </>
          )}

          {/* Recognized names not in the family yet — offer to add them. */}
          {!readOnly && newPeople().length > 0 && (
            <div className="suggest">
              <span className="suggest-label">New people we heard</span>
              <div className="chips">
                {newPeople().map((n) => (
                  <button key={n} className="chip chip-add" onClick={() => addToFamily(n)}>
                    + {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Voice-note view (from Recordings): transcript leads, article collapsed. */}
          {recordingView && (
            <>
              <details className="transcript" open>
                <summary>Transcript</summary>
                {transcriptLines}
              </details>
              <details className="transcript">
                <summary>Article: {result.chapter.title}</summary>
                <article className="chapter-prose" style={{ marginTop: 16 }}>
                  {proseParas}
                </article>
                {entityChips}
              </details>
              <button
                className="back-link"
                style={{ marginTop: 16 }}
                onClick={() =>
                  viewRecording(result as StoredRecording, "articles", detailPerson)
                }
              >
                Go to the article it shaped ›
              </button>
            </>
          )}

          {/* Article view (from Articles / Story) and the generation preview. */}
          {!recordingView && (
            <>
              <article className="chapter-prose">{proseParas}</article>
              {readOnly && (
                <AudioNote audio={(result as StoredRecording).audio} />
              )}
              <details className="transcript">
                <summary>View transcript</summary>
                {transcriptLines}
              </details>
              {readOnly && entityChips}
            </>
          )}

          {readOnly ? (
            <>
              <div className="divider-soft" />
              <button className="btn btn-ghost" onClick={backToOrigin}>
                Back
              </button>
            </>
          ) : (
            // Fixed, always-visible action bar: tags + where to save + approve.
            <div className="action-bar">
              <div className="action-bar-inner">
                {result.chapter.entities.length > 0 && (
                  <div className="chips action-tags">
                    {result.chapter.entities.map((e, i) => (
                      <span className="chip" key={i}>{e.name}</span>
                    ))}
                  </div>
                )}
                <div className="action-bottom">
                  <label className="assign">
                    <span>Save to</span>
                    <select
                      value={assignTo}
                      onChange={(e) => setAssignTo(e.target.value)}
                    >
                      {storyOptions().map((n) => (
                        <option key={n} value={n}>
                          {family?.owner.name === n ? `${n} (you)` : `${n}'s story`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="btn btn-primary" onClick={approveChapter}>
                    Approve chapter
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {showFab && (
        <button className="fab" onClick={() => beginRecording("chapter")} aria-label="Start a new recording">
          <span className="fab-dot" aria-hidden />
        </button>
      )}
    </main>
  );
}
