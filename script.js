const flowSteps = [
  { id: "start",     label: "Start" },
  { id: "recording", label: "Recording" },
  { id: "topics",    label: "Transcript" },
  { id: "review",    label: "Review" },
  { id: "final",     label: "Chapter" },
];

const topics = [
  { id: "school",   label: "School",             confidence: "Primary" },
  { id: "honeymoon",label: "Honeymoon",           confidence: "Mentioned" },
  { id: "family",   label: "Family",              confidence: "Mentioned" },
];

const topicQuestions = {
  school: [
    "What did a normal school morning look like?",
    "Who was your favorite teacher, and why?",
    "What did you do after classes ended?",
  ],
  honeymoon: [
    "How did you decide where to go?",
    "What surprised you most about the trip?",
    "What's a small moment you still remember clearly?",
  ],
  family: [
    "Who were you closest to growing up?",
    "What's a story that always gets retold at gatherings?",
    "What did your family do on special occasions?",
  ],
};

const mockTranscript = [
  { speaker: 1, text: "Can you tell me what school was like for you back then?" },
  { speaker: 2, text: "It was different then. We walked every morning — twenty minutes, maybe more in winter." },
  { speaker: 1, text: "What do you remember about the building itself?" },
  { speaker: 2, text: "The wooden desks. And the teacher had this blue ink bottle at the front. It made the whole room feel serious." },
  { speaker: 1, text: "Was it strict?" },
  { speaker: 2, text: "Very. But not cruel. You sat straight, you listened. Still, there were ways around it — who could make you laugh without moving their mouth." },
  { speaker: 1, text: "And after school?" },
  { speaker: 2, text: "We ran. Out the gate and gone. Uncle Paul used to hide his report card under the fence post. We teased him about that for forty years." },
  { speaker: 1, text: "You also mentioned the honeymoon — the train ride." },
  { speaker: 2, text: "Ah, yes. We had a small bag, too much hope for the weather. That kind of nervous happiness — everything felt new." },
];

const chapterDrafts = {
  school: `The walk to school felt longer in those days, though it could not have been more than twenty minutes. I remember the sound of my shoes on the pavement and the way I tried to arrive with my hair still combed, even when the wind had other plans.

Our classroom had wooden desks with small scratches from generations before us. There was a blue ink bottle near the teacher's table, and somehow that bottle made the whole room feel serious. We were expected to sit straight, listen carefully, and not waste words.

Still, school was not only strictness. It was the place where I learned who could make me laugh without moving their mouth, who would share a pencil, and who was brave enough to ask a question when the rest of us were pretending to understand.`,
  honeymoon: `The honeymoon train ride is still bright in my mind, not because it was grand, but because everything felt new. We had a small bag, too much hope for the weather, and the kind of nervous happiness that makes even a delay feel like part of the adventure.

I remember looking across the carriage and thinking that life had quietly changed. There was no announcement, no ceremony left by then, only the rhythm of the train and the simple fact that we were traveling together.`,
  family: `In our family, affection often arrived disguised as teasing. Nobody gave a long speech if a short joke would do. That was how we kept stories alive: someone would mention Uncle Paul and the report cards, and suddenly the whole table knew exactly where the conversation was going.

Those jokes were not cruel. They were little handles on memory, ways to hold on to people and moments that might otherwise slip away.`,
};

const polishedSuffix =
  "\n\nModerator note: this draft has been lightly polished in the mock UI while keeping the same warm, concrete voice.";

let currentStep    = "start";
let selectedTopic  = topics[0].id;
let modalSelectedTopic = null;
let wantsQuestions = false;
let secondsElapsed = 0;
let timerInterval  = null;
let parkedTopics   = [];
let approvedChapters = [];
let activeSidebarPanel = "chapters";

// Transcript source: mock conversation by default, or the diarized lines from
// a transcribed/loaded file.
let activeTranscript = mockTranscript;
let uploadedTranscriptText = null;
// Custom display names per detected speaker, keyed by speaker index.
let speakerNames = {};
// Topics extracted from the current transcript (replaces the old dummy list).
let detectedTopics = [];
// Title produced by Qwen alongside the chapter draft, if any.
let generatedChapterTitle = null;

const el = {
  steps:          document.querySelector("#steps"),
  screenLabel:    document.querySelector("#screenLabel"),
  screenTitle:    document.querySelector("#screenTitle"),
  timer:          document.querySelector("#timer"),
  elapsedBadge:   document.querySelector("#elapsedBadge"),
  topicOptions:   document.querySelector("#topicOptions"),
  topicBadge:     document.querySelector("#topicBadge"),
  chapterEditor:  document.querySelector("#chapterEditor"),
  finalTitle:     document.querySelector("#finalTitle"),
  finalText:      document.querySelector("#finalText"),
  topicHint:      document.querySelector("#topicHint"),
  topicHintLabel: document.querySelector("#topicHintLabel"),
  topicHintQuestions: document.querySelector("#topicHintQuestions"),
  transcriptBody: document.querySelector("#transcriptBody"),
  topicModal:     document.querySelector("#topicModal"),
  modalTopicPicker: document.querySelector("#modalTopicPicker"),
  modalTopicList: document.querySelector("#modalTopicList"),
  noteInput:      document.querySelector("#noteInput"),
  apiKey:         document.querySelector("#apiKey"),
  qwenKey:        document.querySelector("#qwenKey"),
  audioUpload:    document.querySelector("#audioUpload"),
  uploadButtonText: document.querySelector("#uploadButtonText"),
  debugMode:      document.querySelector("#debugMode"),
  loadExample:    document.querySelector("#loadExample"),
  uploadStatus:   document.querySelector("#uploadStatus"),
  // Sidebar
  chaptersCount:  document.querySelector("#chaptersCount"),
  chaptersEmpty:  document.querySelector("#chaptersEmpty"),
  chaptersOl:     document.querySelector("#chaptersOl"),
  parkingCount:   document.querySelector("#parkingCount"),
  parkingEmpty:   document.querySelector("#parkingEmpty"),
  parkingList:    document.querySelector("#parkingList"),
  // Nav panels
  panelChapters:    document.querySelector("#panelChapters"),
  panelRecordings:  document.querySelector("#panelRecordings"),
  panelParkingLot:  document.querySelector("#panelParkingLot"),
  panelSettings:    document.querySelector("#panelSettings"),
};

// ─── Helpers ─────────────────────────────────────────────

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function escapeAttr(value) {
  return String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function speakerName(index) {
  return speakerNames[index] || `Speaker ${index}`;
}

// ─── Step breadcrumb ─────────────────────────────────────

function renderSteps() {
  const activeIdx = flowSteps.findIndex(s => s.id === currentStep);
  el.steps.innerHTML = flowSteps.map((step, i) => {
    const cls = i === activeIdx ? "active" : i < activeIdx ? "done" : "";
    return `<li class="${cls}"><span>${i + 1}</span>${step.label}</li>`;
  }).join("");
}

// ─── Screen routing ──────────────────────────────────────

const screenMeta = {
  start:     ["Start",      "Set up the memory session"],
  recording: ["Recording",  "Capture the conversation"],
  topics:    ["Transcript", "Review the recording"],
  review:    ["Review",     "Read, edit, and approve"],
  final:     ["Chapter",    "Approved chapter"],
};

function setScreen(stepId) {
  currentStep = stepId;
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.querySelector(`#${stepId}Screen`).classList.add("active");
  if (el.screenLabel && el.screenTitle) {
    [el.screenLabel.textContent, el.screenTitle.textContent] = screenMeta[stepId];
  }
  renderSteps();
}

// ─── Sidebar nav ─────────────────────────────────────────

const panelMap = {
  chapters:   el.panelChapters,
  recordings: el.panelRecordings,
  parkingLot: el.panelParkingLot,
  settings:   el.panelSettings,
};

function switchSidebarPanel(panelKey) {
  activeSidebarPanel = panelKey;
  Object.entries(panelMap).forEach(([key, panel]) => {
    panel.hidden = key !== panelKey;
  });
  document.querySelectorAll(".nav-item").forEach(btn => btn.classList.remove("active"));
  document.querySelector(`#nav${panelKey.charAt(0).toUpperCase() + panelKey.slice(1)}`).classList.add("active");
}

document.querySelector("#navChapters").addEventListener("click",   () => switchSidebarPanel("chapters"));
document.querySelector("#navRecordings").addEventListener("click",  () => switchSidebarPanel("recordings"));
document.querySelector("#navParkingLot").addEventListener("click",  () => switchSidebarPanel("parkingLot"));
document.querySelector("#navSettings").addEventListener("click",    () => switchSidebarPanel("settings"));

// ─── Chapters list ────────────────────────────────────────

function renderChaptersList() {
  const count = approvedChapters.length;
  el.chaptersCount.hidden = count === 0;
  el.chaptersCount.textContent = count;

  if (count === 0) {
    el.chaptersEmpty.hidden = false;
    el.chaptersOl.hidden = true;
    return;
  }
  el.chaptersEmpty.hidden = true;
  el.chaptersOl.hidden = false;
  el.chaptersOl.innerHTML = approvedChapters.map((ch, i) => `
    <li>
      <button class="chapter-item" type="button" data-chapter="${i}">
        <span class="chapter-item-num">${i + 1}</span>
        <span class="chapter-item-title">${ch.title}</span>
      </button>
    </li>`
  ).join("");
}

el.chaptersOl.addEventListener("click", e => {
  const btn = e.target.closest("[data-chapter]");
  if (!btn) return;
  const ch = approvedChapters[Number(btn.dataset.chapter)];
  if (!ch) return;
  el.finalTitle.textContent = ch.title;
  el.finalText.textContent  = ch.text;
  setScreen("final");
  switchSidebarPanel("chapters");
});

// ─── Parking lot ──────────────────────────────────────────

function renderParkingList() {
  const count = parkedTopics.length;
  el.parkingCount.hidden = count === 0;
  el.parkingCount.textContent = count;

  if (count === 0) {
    el.parkingEmpty.hidden = false;
    el.parkingList.hidden = true;
    return;
  }
  el.parkingEmpty.hidden = true;
  el.parkingList.hidden = false;
  el.parkingList.innerHTML = parkedTopics.map(t =>
    `<li class="parking-list-item">${t}</li>`
  ).join("");
}

function addParkedTopic() {
  const text = el.noteInput.value.trim();
  if (!text) return;
  parkedTopics.push(text);
  el.noteInput.value = "";
  renderParkingList();
}

el.noteInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addParkedTopic(); }
});

// ─── Modal ────────────────────────────────────────────────

function showModal() {
  modalSelectedTopic = null;
  wantsQuestions = false;
  el.modalTopicPicker.hidden = true;
  document.querySelectorAll(".modal-topic-chip").forEach(c => c.classList.remove("selected"));
  document.querySelectorAll(".modal-option").forEach(o => o.classList.remove("selected"));
  el.topicModal.hidden = false;
}

function hideModal() {
  el.topicModal.hidden = true;
}

function renderModalTopics() {
  el.modalTopicList.innerHTML = topics.map(t =>
    `<button class="modal-topic-chip" type="button" data-topic="${t.id}">${t.label}</button>`
  ).join("");
}

// ─── Recording ────────────────────────────────────────────

function startRecording() {
  hideModal();

  if (wantsQuestions && modalSelectedTopic) {
    selectedTopic = modalSelectedTopic;
    const topic = topics.find(t => t.id === selectedTopic);
    el.topicHintLabel.textContent  = topic.label;
    el.topicHintQuestions.innerHTML = (topicQuestions[selectedTopic] || [])
      .map(q => `<li>${q}</li>`).join("");
    el.topicHint.hidden = false;
  } else {
    el.topicHint.hidden = true;
  }

  secondsElapsed = 0;
  el.timer.textContent = formatTime(0);
  timerInterval = window.setInterval(() => {
    secondsElapsed += 1;
    el.timer.textContent = formatTime(secondsElapsed);
  }, 1000);
  setScreen("recording");
}

function stopRecording() {
  window.clearInterval(timerInterval);
  timerInterval = null;
  if (secondsElapsed < 12) secondsElapsed = 12;
  el.elapsedBadge.textContent = formatTime(secondsElapsed);
  renderTranscript();
  detectAndRenderTopics();
  setScreen("topics");
}

// ─── Transcript ───────────────────────────────────────────

function renderTranscript() {
  const speakers = [...new Set(activeTranscript.map((line) => line.speaker))];

  const legend = speakers
    .map(
      (s) => `
      <label class="speaker-namer">
        <span class="speaker-swatch speaker-${s}"></span>
        <input
          class="speaker-name-input"
          type="text"
          data-speaker="${s}"
          value="${escapeAttr(speakerName(s))}"
          aria-label="Name for speaker ${s}"
        />
      </label>`
    )
    .join("");

  const lines = activeTranscript
    .map(
      (line, i) => `
      <div class="transcript-line">
        <span class="transcript-speaker speaker-${line.speaker}" data-speaker="${line.speaker}">${escapeHtml(
        speakerName(line.speaker)
      )}</span>
        <div class="transcript-text" contenteditable="true" data-line="${i}">${escapeHtml(line.text)}</div>
      </div>`
    )
    .join("");

  el.transcriptBody.innerHTML = `
    <div class="speaker-legend">
      <span class="speaker-legend-label">Speakers</span>
      ${legend}
    </div>
    <p class="transcript-edit-hint">Tap a name to rename a speaker, or click any line to edit the text.</p>
    <div class="transcript-lines">${lines}</div>`;
}

// Live editing: renaming a speaker updates every line for that speaker, and
// editing a line writes straight back into activeTranscript.
el.transcriptBody.addEventListener("input", (event) => {
  const nameInput = event.target.closest(".speaker-name-input");
  if (nameInput) {
    const speaker = Number(nameInput.dataset.speaker);
    const name = nameInput.value.trim();
    if (name) speakerNames[speaker] = name;
    else delete speakerNames[speaker];
    el.transcriptBody
      .querySelectorAll(`.transcript-speaker[data-speaker="${speaker}"]`)
      .forEach((label) => {
        label.textContent = speakerName(speaker);
      });
    return;
  }

  const lineEl = event.target.closest(".transcript-text[data-line]");
  if (lineEl) {
    const index = Number(lineEl.dataset.line);
    if (activeTranscript[index]) activeTranscript[index].text = lineEl.innerText;
  }
});

// ─── Topics ───────────────────────────────────────────────

// Words ignored when extracting topics: function words plus common
// conversational fillers and generic verbs/adjectives.
const TOPIC_STOPWORDS = new Set(
  `the a an and or but so if then than that this these those there here it its it's
   is are was were be been being am do does did doing have has had having will would
   shall should can could may might must of to in on at by for with from into about
   over under again further once as up down out off no not only own same too very just
   i you he she we they me him her us them my your his our their mine yours ours your's
   what which who whom whose when where why how all any both each few more most other
   some such own get got go goes going went come came make made take took
   really nice good great little well like yeah yes okay ok mm mmm hmm huh uh um umm
   thing things stuff lot lots kind sort bit something someone anyone everyone people
   today day days time times back think thought know knew want wanted say said tell told
   feel felt look looked looking remember much many still even ever never always maybe
   because around perceive multiple another anymore`
    .split(/\s+/)
    .filter(Boolean)
);

function stemWord(word) {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

// Local fallback topic detection via stop-word-filtered word frequency.
function detectTopics(transcript) {
  const text = transcript.map((l) => l.text).join(" ").toLowerCase();
  const tokens = text.match(/[a-z][a-z']{2,}/g) || [];

  const counts = new Map();
  const display = new Map();
  for (const token of tokens) {
    const word = token.replace(/'s$/, "");
    if (word.length < 4 || TOPIC_STOPWORDS.has(word)) continue;
    const key = stemWord(word);
    if (TOPIC_STOPWORDS.has(key)) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
    if (!display.has(key)) display.set(key, word);
  }

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  if (!ranked.length) return [];

  return ranked.map(([key, count], i) => {
    const label = display.get(key);
    return {
      id: key,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      confidence: i === 0 && count > 1 ? "Primary" : count > 1 ? "Recurring" : "Mentioned",
    };
  });
}

function refreshDetectedTopics() {
  detectedTopics = detectTopics(activeTranscript);
  selectedTopic = detectedTopics.length ? detectedTopics[0].id : null;
}

// Ask Qwen for richer, theme-level topics. Returns normalized topic objects.
async function detectTopicsWithQwen() {
  const content = await qwenChat(
    [
      {
        role: "system",
        content:
          "You analyze interview and conversation transcripts and identify the main memoir themes being discussed. Respond with JSON only, no prose.",
      },
      {
        role: "user",
        content:
          `Identify 3 to 5 distinct themes from the transcript below that would make compelling memoir chapter subjects. ` +
          `Favor meaningful themes (e.g. "First Day of School", "Childhood Friendships") over single generic words. ` +
          `For each, give a short title-case "label" (1-4 words) and a "confidence" that is one of "Primary", "Recurring", or "Mentioned". ` +
          `Return JSON exactly like {"topics":[{"label":"...","confidence":"..."}]}.\n\nTranscript:\n${transcriptText()}`,
      },
    ],
    { temperature: 0.3 }
  );

  const parsed = parseJsonLoose(content);
  const list = parsed && Array.isArray(parsed.topics) ? parsed.topics : null;
  if (!list || !list.length) throw new Error("No topics in Qwen response");

  const allowed = ["Primary", "Recurring", "Mentioned"];
  const seen = new Set();
  return list
    .filter((t) => t && t.label)
    .slice(0, 5)
    .map((t, i) => {
      let id = slugify(t.label) || `topic-${i}`;
      while (seen.has(id)) id += `-${i}`;
      seen.add(id);
      return {
        id,
        label: String(t.label).trim(),
        confidence: allowed.includes(t.confidence) ? t.confidence : "Mentioned",
      };
    });
}

// Render local topics immediately, then upgrade with Qwen if a key is present.
function detectAndRenderTopics() {
  refreshDetectedTopics();
  if (!getQwenKey()) {
    renderTopics();
    return;
  }
  renderTopics({ refining: true });
  detectTopicsWithQwen()
    .then((topics) => {
      if (topics.length) {
        detectedTopics = topics;
        selectedTopic = topics[0].id;
      }
    })
    .catch((error) => console.warn("Qwen topic detection failed, using local topics:", error))
    .finally(() => renderTopics());
}

function currentTopic() {
  return (
    detectedTopics.find((t) => t.id === selectedTopic) ||
    detectedTopics[0] || { id: "memory", label: "Memory", confidence: "" }
  );
}

function renderTopics({ refining = false } = {}) {
  const refiningNote = refining ? `<p class="topic-refining">Refining topics with Qwen…</p>` : "";

  if (!detectedTopics.length) {
    el.topicOptions.innerHTML =
      refiningNote || `<p class="topic-empty">No clear topics detected — you can still write a chapter.</p>`;
    return;
  }

  const buttons = detectedTopics
    .map(
      (t) => `
    <button class="topic-button ${t.id === selectedTopic ? "active" : ""}" type="button" data-topic="${escapeAttr(t.id)}">
      <span>${escapeHtml(t.label)}</span>
      <small>${escapeHtml(t.confidence)}</small>
    </button>`
    )
    .join("");

  el.topicOptions.innerHTML = refiningNote + buttons;
}

function selectTopic(topicId) {
  selectedTopic = topicId;
  renderTopics();
}

// ─── Chapter ──────────────────────────────────────────────

async function writeChapter() {
  const topic = currentTopic();
  el.topicBadge.textContent = topic.label;
  generatedChapterTitle = null;

  const fallback = uploadedTranscriptText !== null
    ? transcriptText()
    : chapterDrafts[selectedTopic] || transcriptText();

  setScreen("review");

  if (!getQwenKey()) {
    el.chapterEditor.value = fallback;
    return;
  }

  el.chapterEditor.value = "Writing your chapter with Qwen…";
  el.chapterEditor.disabled = true;
  try {
    const content = await qwenChat(
      [
        {
          role: "system",
          content:
            "You are a skilled memoir ghostwriter. You transform raw interview transcripts into warm, vivid, emotionally engaging first-person memoir chapters that are a pleasure to read. Write from the perspective of the person recounting their memories. Preserve every fact and their authentic voice; never invent events that the transcript does not support. Use flowing prose with no speaker labels and no question-and-answer format. Respond with JSON only.",
        },
        {
          role: "user",
          content:
            `Write a polished, enjoyable memoir chapter focused on the theme "${topic.label}". ` +
            `Base it strictly on the transcript: smooth out filler words and repetition, organize the memories naturally, and keep it concrete and heartfelt. ` +
            `Write 3 to 6 short paragraphs, and give it a short, evocative chapter title. ` +
            `Return JSON exactly like {"title":"...","chapter":"..."}.\n\nTranscript:\n${transcriptText()}`,
        },
      ],
      { temperature: 0.8 }
    );

    const parsed = parseJsonLoose(content);
    if (parsed && parsed.chapter) {
      generatedChapterTitle = parsed.title ? String(parsed.title).trim() : null;
      el.chapterEditor.value = String(parsed.chapter).trim();
    } else {
      el.chapterEditor.value = content.trim() || fallback;
    }
  } catch (error) {
    console.warn("Qwen chapter generation failed, using transcript:", error);
    el.chapterEditor.value = fallback;
  } finally {
    el.chapterEditor.disabled = false;
  }
}

function polishChapter() {
  if (!el.chapterEditor.value.includes(polishedSuffix.trim())) {
    el.chapterEditor.value += polishedSuffix;
  }
}

function approveChapter() {
  const topic = currentTopic();
  const title =
    generatedChapterTitle ||
    (topic.id === "school" ? "The Walk to School" : `${topic.label} Memories`);
  const text  = el.chapterEditor.value;

  el.finalTitle.textContent = title;
  el.finalText.textContent  = text;

  approvedChapters.push({ title, text });
  renderChaptersList();
  switchSidebarPanel("chapters");
  setScreen("final");
}

// ─── Reset ────────────────────────────────────────────────

function resetDemo() {
  window.clearInterval(timerInterval);
  timerInterval      = null;
  selectedTopic      = null;
  detectedTopics     = [];
  generatedChapterTitle = null;
  modalSelectedTopic = null;
  wantsQuestions     = false;
  secondsElapsed     = 0;
  parkedTopics       = [];
  approvedChapters   = [];
  activeTranscript   = mockTranscript;
  uploadedTranscriptText = null;
  speakerNames       = {};

  el.timer.textContent        = "00:00";
  el.elapsedBadge.textContent = "00:00";
  el.noteInput.value = "";
  el.topicHint.hidden = true;
  if (el.audioUpload) el.audioUpload.value = "";
  if (el.uploadStatus) { el.uploadStatus.hidden = true; el.uploadStatus.textContent = ""; }

  renderChaptersList();
  renderParkingList();
  renderTopics();
  hideModal();
  switchSidebarPanel("chapters");
  setScreen("start");
}

// ─── API config + helpers ─────────────────────────────────

const ELEVEN_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";
const API_KEY_STORAGE = "memoir_eleven_api_key";
const DEBUG_MODE_STORAGE = "memoir_debug_mode";

// Qwen via Alibaba DashScope (OpenAI-compatible, international endpoint).
const QWEN_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const QWEN_MODEL = "qwen3.6-max-preview";
const QWEN_KEY_STORAGE = "memoir_qwen_api_key";

function getApiKey() {
  return (el.apiKey.value || "").trim();
}

function getQwenKey() {
  return (el.qwenKey.value || "").trim();
}

function setUploadStatus(message, isError = false) {
  el.uploadStatus.hidden = false;
  el.uploadStatus.textContent = message;
  el.uploadStatus.classList.toggle("upload-status-error", isError);
}

function parseJsonLoose(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    /* fall through to bracket extraction */
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* give up */
    }
  }
  return null;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function transcriptText() {
  return activeTranscript.map((line) => `${speakerName(line.speaker)}: ${line.text}`).join("\n");
}

// Minimal Qwen chat-completions call; returns the assistant's text content.
async function qwenChat(messages, { temperature = 0.7 } = {}) {
  const key = getQwenKey();
  if (!key) throw new Error("No Qwen API key");

  const response = await fetch(QWEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: QWEN_MODEL, messages, temperature }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.error?.message || body?.message || "";
    } catch {
      /* ignore non-JSON errors */
    }
    throw new Error(`${response.status} ${response.statusText}${detail ? ` — ${detail}` : ""}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
}

// ─── ElevenLabs Scribe v2 transcription ───────────────────

async function transcribeAudioFile(file, apiKey) {
  const form = new FormData();
  form.append("file", file);
  form.append("model_id", "scribe_v2");
  form.append("diarize", "true");
  form.append("timestamps_granularity", "word");

  const response = await fetch(ELEVEN_STT_URL, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.detail?.message || (typeof body?.detail === "string" ? body.detail : "");
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(`${response.status} ${response.statusText}${detail ? ` — ${detail}` : ""}`);
  }

  return response.json();
}

// Collapse the per-word diarized response into speaker-labeled turns.
function buildDiarizedTranscript(data) {
  const words = Array.isArray(data.words) ? data.words : [];
  const speakerOrder = [];
  const turns = [];
  let current = null;

  for (const word of words) {
    if (word.type === "audio_event") continue;
    const speakerId = word.speaker_id || "speaker_0";
    if (!speakerOrder.includes(speakerId)) speakerOrder.push(speakerId);
    if (!current || current.speakerId !== speakerId) {
      current = { speakerId, text: "" };
      turns.push(current);
    }
    current.text += word.text || "";
  }

  return turns
    .map((turn) => ({ speaker: speakerOrder.indexOf(turn.speakerId) + 1, text: turn.text.trim() }))
    .filter((turn) => turn.text);
}

// ─── Debug transcript loading (no STT API) ────────────────

// Hardcoded example interview (free-text Q&A) so Qwen can be tested in debug
// mode without spending ElevenLabs credits.
const DEBUG_SAMPLE_INTERVIEW = `Interview with my grandfather. How old are you? I am 72 years old. Where did you spend your childhood? In Hanover. This is located in the north-west of Germany. At which age do your childhood memories begin? At the age of three. Could you please describe your childhood's daily life? My childhood was ambivalent. Until the age of three I lived in wealth. But that changed into the opposite after the destruction of Hanover and our evacuation to the little village of Wennigsen. The living conditions were hard because there was a lack of the things that are important for life. My father was a soldier at the eastern front in Russia and he was not home very often. Since 1944 he was missing and he never came back again. At the age of six I visited the local Volksschule until I got my graduation after year eight. Because of living in the countryside we children were quite free. What did you do in your spare time? Besides school we played football in the streets because there was less traffic, or we went to the forests to play. Being hungry all the time we got ourselves fruits and vegetables from the neighbors' gardens. Of course we had no TV so we focused on athletics. I did gymnastics, played football and went playing table tennis. In summer we went swimming in the local swimming pool and after that, especially at weekends, we went dancing, went to cinemas or visited pubs. The winters were long and cold so we rode a sleigh or went ice-skating. How was your daily life at school and could you please name some differences to the present? I was not a hard worker at school. I often had problems doing my homework so that the cane ruled very often. When you showed bad behavior you had to lie on the desk and got some punches with the cane on your bottom. In those days we had to go to school six days a week. Often we had afternoon lessons because there were no teachers. When the lesson started and the teacher went into the classroom we had to stand up to show him our hands so that he could see if they were clean. After that we sang a song. Besides the normal lessons we also had confirmation lessons after school. After eight years of school and confirmation we searched for an apprenticeship. For one year I could not find an apprenticeship because there weren't enough of them. After this year I finally found an apprenticeship as a clerk. How were you brought up and do you believe that there is a change to the present time? In contrast to the present way of bringing up children ours was very strict. You had to be very accurate, which I often did not manage. The cane was always nearby, at home, at school and sometimes at the police. The people attached importance to politeness and moral values such as greeting with a curtsey for the girls and a bow for the boys, respecting older people, and being home at nightfall. Did your parents have any expectations of you or did you have any commitments? I had no commitments. From time to time I had to help my mother in the garden but I was able to slip away very often. But there was always the expectation that you behaved according to the moral values. Did the social status play any role? Yes, absolutely. The children from privileged families were not allowed to play with us. But they played with us anyway, because it was a great adventure for them to go to the forests too. Were there any different roles for men and women? Of course girls were treated differently from boys. In school for example only the girls had a subject called handiwork while the boys played football. The women were responsible for the children and housekeeping. During the war there were less men so the whole responsibility was with the women. Besides the housekeeping and obtaining of fuel, my mother had to go to work because she had to feed my sister, my brother and me. She worked on a farm and later in a cinema. After a few years she opened up her own business, a kiosk.`;

// Parse a "Speaker N" + text transcript (e.g. Transcript.md).
function parseTranscriptMarkdown(text) {
  const speakerIndex = {};
  const lines = [];
  let current = null;

  const flush = () => {
    if (current && current.buffer.length) {
      const joined = current.buffer.join(" ").replace(/\s+/g, " ").trim();
      if (joined) lines.push({ speaker: current.speaker, text: joined });
    }
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^transcript$/i.test(line)) continue;
    if (/^\d+\s+speakers?$/i.test(line)) continue;

    const header = line.match(/^speaker\s+(\d+)\s*:?\s*(.*)$/i);
    if (header) {
      flush();
      const label = header[1];
      if (!(label in speakerIndex)) speakerIndex[label] = Object.keys(speakerIndex).length + 1;
      current = { speaker: speakerIndex[label], buffer: [] };
      if (header[2]) current.buffer.push(header[2]);
      continue;
    }

    if (current) current.buffer.push(line);
  }
  flush();
  return lines;
}

// Parse a free-text Q&A interview: question sentences (ending in "?") become
// Speaker 1 (interviewer), answer sentences become Speaker 2.
function parseQATranscript(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  const sentences = clean.match(/[^.?!]*[.?!]+/g) || [clean];
  const lines = [];
  let current = null;

  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    const speaker = /\?["')\]]*$/.test(sentence) ? 1 : 2;
    if (!current || current.speaker !== speaker) {
      current = { speaker, text: sentence };
      lines.push(current);
    } else {
      current.text += ` ${sentence}`;
    }
  }
  return lines;
}

// Choose the parser based on the file's shape.
function parseTranscript(text) {
  return /^\s*speaker\s+\d+/im.test(text) ? parseTranscriptMarkdown(text) : parseQATranscript(text);
}

function useDebugTranscript(text, sourceName) {
  const lines = parseTranscript(text);
  if (!lines.length) {
    setUploadStatus("Couldn't parse a transcript from that file.", true);
    return;
  }

  uploadedTranscriptText = lines.map((l) => l.text).join("\n\n");
  activeTranscript = lines;
  speakerNames = {};

  const speakerCount = new Set(lines.map((l) => l.speaker)).size;
  el.elapsedBadge.textContent = `${speakerCount} speaker${speakerCount > 1 ? "s" : ""}`;
  setUploadStatus(`Debug — loaded "${sourceName}" (${lines.length} segments, no STT API used).`);

  renderTranscript();
  detectAndRenderTopics();
  setScreen("topics");
}

async function loadDebugTranscript(file) {
  const text = await file.text();
  useDebugTranscript(text, file.name);
}

function applyDebugMode() {
  const debug = el.debugMode.checked;
  el.audioUpload.accept = debug ? ".md,.txt,text/markdown,text/plain" : "audio/*,video/*";
  el.uploadButtonText.textContent = debug ? "Load transcript file (.md / .txt)" : "Upload an audio file";
  el.loadExample.hidden = !debug;
}

// ─── Upload handler ───────────────────────────────────────

async function handleAudioUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  // Debug path: parse a local transcript file instead of calling the STT API.
  const looksLikeText = /\.(md|txt)$/i.test(file.name) || (file.type || "").startsWith("text/");
  if (el.debugMode.checked || looksLikeText) {
    try {
      await loadDebugTranscript(file);
    } catch (error) {
      console.error(error);
      setUploadStatus(`Couldn't read file: ${error.message}`, true);
    } finally {
      event.target.value = "";
    }
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    setUploadStatus("Enter your ElevenLabs API key first.", true);
    el.apiKey.focus();
    event.target.value = "";
    return;
  }

  setUploadStatus(`Transcribing "${file.name}" with Scribe v2…`);
  try {
    const data = await transcribeAudioFile(file, apiKey);
    const lines = buildDiarizedTranscript(data);

    if (!lines.length) {
      setUploadStatus("No speech detected in that file.", true);
      return;
    }

    uploadedTranscriptText = (data.text || lines.map((l) => l.text).join("\n\n")).trim();
    activeTranscript = lines;
    speakerNames = {};

    const speakerCount = new Set(lines.map((l) => l.speaker)).size;
    el.elapsedBadge.textContent = `${speakerCount} speaker${speakerCount > 1 ? "s" : ""}`;
    setUploadStatus(`Done — ${lines.length} segments, ${speakerCount} speaker${speakerCount > 1 ? "s" : ""}.`);

    renderTranscript();
    detectAndRenderTopics();
    setScreen("topics");
  } catch (error) {
    console.error(error);
    setUploadStatus(`Transcription failed: ${error.message}`, true);
  } finally {
    event.target.value = "";
  }
}

// ─── Event wiring ─────────────────────────────────────────

document.querySelector("#startButton").addEventListener("click",    showModal);
document.querySelector("#stopButton").addEventListener("click",     stopRecording);
document.querySelector("#writeButton").addEventListener("click",    writeChapter);
document.querySelector("#polishButton").addEventListener("click",   polishChapter);
document.querySelector("#approveButton").addEventListener("click",  approveChapter);
document.querySelector("#resetButton").addEventListener("click",    resetDemo);
document.querySelector("#backToReviewButton").addEventListener("click", () => setScreen("review"));
document.querySelector("#parkNoteButton").addEventListener("click", addParkedTopic);
el.audioUpload.addEventListener("change", handleAudioUpload);
el.loadExample.addEventListener("click", () =>
  useDebugTranscript(DEBUG_SAMPLE_INTERVIEW, "Hardcode Interview.md")
);

// Remember API keys locally (sent only to their respective APIs).
try {
  const savedKey = localStorage.getItem(API_KEY_STORAGE);
  if (savedKey) el.apiKey.value = savedKey;
  const savedQwenKey = localStorage.getItem(QWEN_KEY_STORAGE);
  if (savedQwenKey) el.qwenKey.value = savedQwenKey;
} catch {
  /* localStorage may be unavailable */
}
el.apiKey.addEventListener("change", () => {
  try { localStorage.setItem(API_KEY_STORAGE, getApiKey()); } catch { /* ignore */ }
});
el.qwenKey.addEventListener("change", () => {
  try { localStorage.setItem(QWEN_KEY_STORAGE, getQwenKey()); } catch { /* ignore */ }
});

// Debug mode: remember the toggle and switch the uploader between audio and text.
try {
  el.debugMode.checked = localStorage.getItem(DEBUG_MODE_STORAGE) === "true";
} catch {
  /* ignore */
}
applyDebugMode();
el.debugMode.addEventListener("change", () => {
  applyDebugMode();
  try { localStorage.setItem(DEBUG_MODE_STORAGE, String(el.debugMode.checked)); } catch { /* ignore */ }
});

// Modal
document.querySelector("#modalYes").addEventListener("click", () => {
  wantsQuestions = false;
  modalSelectedTopic = null;
  startRecording();
});

document.querySelector("#modalRoughIdea").addEventListener("click", () => {
  wantsQuestions = true;
  document.querySelector("#modalRoughIdea").classList.add("selected");
  document.querySelector("#modalYes").classList.remove("selected");
  el.modalTopicPicker.hidden = false;
  renderModalTopics();
});

el.modalTopicList.addEventListener("click", e => {
  const chip = e.target.closest("[data-topic]");
  if (!chip) return;
  modalSelectedTopic = chip.dataset.topic;
  document.querySelectorAll(".modal-topic-chip").forEach(c => c.classList.remove("selected"));
  chip.classList.add("selected");
});

document.querySelector("#modalStartWithTopic").addEventListener("click", startRecording);
document.querySelector("#modalCancel").addEventListener("click", hideModal);
el.topicModal.addEventListener("click", e => { if (e.target === el.topicModal) hideModal(); });

el.topicOptions.addEventListener("click", e => {
  const btn = e.target.closest("[data-topic]");
  if (btn) selectTopic(btn.dataset.topic);
});

// ─── Init ─────────────────────────────────────────────────

renderTopics();
renderChaptersList();
renderParkingList();
setScreen("start");
