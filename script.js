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
  renderTopics();
  setScreen("topics");
}

// ─── Transcript ───────────────────────────────────────────

function renderTranscript() {
  el.transcriptBody.innerHTML = mockTranscript.map(line => `
    <div class="transcript-line">
      <span class="transcript-speaker speaker-${line.speaker}">Speaker ${line.speaker}</span>
      <span class="transcript-text">${line.text}</span>
    </div>`
  ).join("");
}

// ─── Topics ───────────────────────────────────────────────

function renderTopics() {
  el.topicOptions.innerHTML = topics.map(t => `
    <button class="topic-button ${t.id === selectedTopic ? "active" : ""}" type="button" data-topic="${t.id}">
      <span>${t.label}</span>
      <small>${t.confidence}</small>
    </button>`
  ).join("");
}

function selectTopic(topicId) {
  selectedTopic = topicId;
  renderTopics();
}

// ─── Chapter ──────────────────────────────────────────────

function writeChapter() {
  const topic = topics.find(t => t.id === selectedTopic);
  el.topicBadge.textContent = topic.label;
  el.chapterEditor.value = chapterDrafts[selectedTopic];
  setScreen("review");
}

function polishChapter() {
  if (!el.chapterEditor.value.includes(polishedSuffix.trim())) {
    el.chapterEditor.value += polishedSuffix;
  }
}

function approveChapter() {
  const topic = topics.find(t => t.id === selectedTopic);
  const title = topic.id === "school" ? "The Walk to School" : `${topic.label} Memories`;
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
  selectedTopic      = topics[0].id;
  modalSelectedTopic = null;
  wantsQuestions     = false;
  secondsElapsed     = 0;
  parkedTopics       = [];
  approvedChapters   = [];

  el.timer.textContent        = "00:00";
  el.elapsedBadge.textContent = "00:00";
  el.noteInput.value = "";
  el.topicHint.hidden = true;

  renderChaptersList();
  renderParkingList();
  renderTopics();
  hideModal();
  switchSidebarPanel("chapters");
  setScreen("start");
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
