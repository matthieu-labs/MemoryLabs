import { qwenJSON, QWEN_MODELS } from "./qwen";
import type {
  Transcript,
  SummaryResult,
  StructureResult,
  Chapter,
  IntroResult,
} from "./types";

// The transcript → chapter pipeline from Planning/scope-v1.md.
// Three Qwen calls: summarise (anti-hallucination) → structure → write.
// The whole chain stays in the transcript's own language (auto-detected).

function subjectText(t: Transcript): string {
  return t.segments
    .filter((s) => s.speaker === "subject")
    .map((s) => s.text)
    .join("\n");
}

// STEP 3 — summarise the subject's turns only. This is the anti-hallucination
// guard AND the "word bank": it keeps characteristic phrasing in context and
// extracts entities for cross-chapter links.
async function summarise(t: Transcript): Promise<SummaryResult> {
  const system = `You are a careful editorial assistant building a memoir.
You are given ONLY the interview subject's own spoken words.
Your job is to distill them WITHOUT inventing anything. Never add facts,
names, places, or feelings that were not said. Strip filler and repetition,
but preserve the subject's characteristic vocabulary and turns of phrase.
Detect the language of the input and report it. Respond in that language for
bullets and vocabulary. Return strict JSON only.`;

  const user = `Subject's words:
"""
${subjectText(t)}
"""

Return JSON with this shape:
{
  "language": "ISO code, e.g. en or de",
  "bullets": ["factual point in the subject's framing", ...],
  "vocabulary": ["characteristic word or phrase actually used", ...],
  "entities": [{"type":"person|place|event|time|theme","name":"..."}]
}`;

  const r = await qwenJSON<SummaryResult>(QWEN_MODELS.reason, system, user);
  return {
    language: r.language || t.language,
    bullets: r.bullets ?? [],
    vocabulary: r.vocabulary ?? [],
    entities: r.entities ?? [],
  };
}

// STEP 4 — organise bullets into a chapter outline + derive style params.
async function structure(
  s: SummaryResult,
  topic: string
): Promise<StructureResult> {
  const system = `You are a memoir editor. Organise the given factual bullets
into a single coherent chapter outline focused on the requested topic.
Infer style parameters from how the subject speaks (do not invent content).
Write text fields in the language code provided. Return strict JSON only.`;

  const user = `Topic for this chapter: "${topic}"
Language: ${s.language}
Bullets:
${s.bullets.map((b) => `- ${b}`).join("\n")}
Characteristic vocabulary to keep: ${s.vocabulary.join(", ")}

Return JSON:
{
  "title_hint": "evocative chapter title",
  "life_stage": "childhood|youth|work|family|...",
  "outline": ["ordered narrative beat", ...],
  "style_params": {
    "descriptiveness": "sparse|medium|rich",
    "sentence_length": "short|medium|long",
    "emotional_register": "reserved|warm|expressive"
  }
}`;

  return qwenJSON<StructureResult>(QWEN_MODELS.reason, system, user);
}

// STEP 5 — write the chapter as first-person prose ("Ich-Perspektive"),
// anchored on the preserved vocabulary, in the subject's language.
async function write(
  s: SummaryResult,
  st: StructureResult,
  topic: string
): Promise<{ title: string; prose: string }> {
  const system = `You are ghost-writing a memoir chapter in the FIRST PERSON,
as if the interview subject is telling their own story. Write ONLY in the
language with code "${s.language}". Use the supplied outline and preserved
vocabulary as anchors. Do NOT invent events, names, or places beyond the
material given. Match the requested style. Return strict JSON only.`;

  const user = `Topic: "${topic}"
Suggested title: ${st.title_hint}
Style: descriptiveness=${st.style_params.descriptiveness}, sentence_length=${st.style_params.sentence_length}, emotional_register=${st.style_params.emotional_register}
Preserve these formulations where natural: ${s.vocabulary.join(", ")}
Outline:
${st.outline.map((o, i) => `${i + 1}. ${o}`).join("\n")}

Return JSON: { "title": "...", "prose": "full chapter, paragraphs separated by blank lines" }`;

  const r = await qwenJSON<{ title: string; prose: string }>(
    QWEN_MODELS.write,
    system,
    user
  );
  return { title: r.title || st.title_hint, prose: r.prose || "" };
}

// ─── Onboarding extraction ────────────────────────────────
// From the owner's self-introduction recording, pull their basic facts and
// the people they mention, with each person's relationship to the owner.
export async function extractIntro(
  transcript: Transcript
): Promise<IntroResult> {
  const text = transcript.segments.map((s) => s.text).join("\n");
  const system = `You extract a family graph from someone introducing themselves.
Identify the SPEAKER (the owner) and every PERSON they mention, with that
person's relationship to the owner. Use ONLY relations from this set:
parent, child, sibling, spouse, grandparent, grandchild, other.
Do NOT invent people or facts not stated. Return strict JSON only.`;

  const user = `Self-introduction transcript:
"""
${text}
"""

Return JSON:
{
  "owner": { "name": "owner's first name or '' if unknown", "bornYear": "", "bornPlace": "" },
  "people": [ { "name": "...", "relation": "parent|child|sibling|spouse|grandparent|grandchild|other", "note": "short context if any" } ]
}`;

  const r = await qwenJSON<IntroResult>(QWEN_MODELS.reason, system, user);
  return {
    owner: r.owner ?? { name: "" },
    people: (r.people ?? []).filter((p) => p && p.name),
  };
}

export async function runPipeline(
  transcript: Transcript,
  topic: string
): Promise<Chapter> {
  const summary = await summarise(transcript);
  const struct = await structure(summary, topic);
  const { title, prose } = await write(summary, struct, topic);

  return {
    topic,
    title,
    prose,
    language: summary.language,
    style_params: struct.style_params,
    entities: summary.entities,
  };
}
