// Shared domain types for the Memoir pipeline.

export type Speaker = "interviewer" | "subject";

export interface TranscriptSegment {
  speaker: Speaker;
  text: string;
  start?: number; // seconds
  end?: number;
}

export interface Transcript {
  language: string; // auto-detected, e.g. "en", "de"
  segments: TranscriptSegment[];
}

export type EntityType = "person" | "place" | "event" | "time" | "theme";

export interface Entity {
  type: EntityType;
  name: string;
}

// Step 3 — summary / anti-hallucination pass (subject turns only)
export interface SummaryResult {
  bullets: string[]; // factual points, in the subject's own framing
  vocabulary: string[]; // characteristic words/phrases to preserve
  entities: Entity[]; // people / places / events → cross-chapter links
  language: string; // confirmed language to write in
}

export interface StyleParams {
  descriptiveness: "sparse" | "medium" | "rich";
  sentence_length: "short" | "medium" | "long";
  emotional_register: "reserved" | "warm" | "expressive";
}

// Step 4 — manuscript structure
export interface StructureResult {
  title_hint: string;
  life_stage: string; // childhood, work, family, etc.
  outline: string[]; // ordered beats for the chapter
  style_params: StyleParams;
}

// Step 5 — written chapter
export interface Chapter {
  topic: string;
  title: string;
  prose: string;
  language: string;
  style_params: StyleParams;
  entities: Entity[];
}

export interface GenerateResult {
  transcript: Transcript;
  chapter: Chapter;
  mocked: { transcript: boolean; chapter: boolean };
}

// ─── Family / onboarding ──────────────────────────────────
export type Relation =
  | "self"
  | "parent"
  | "child"
  | "sibling"
  | "spouse"
  | "grandparent"
  | "grandchild"
  | "other";

export interface Owner {
  name: string;
  bornYear?: string;
  bornPlace?: string;
}

export interface RelatedPerson {
  name: string;
  relation: Relation;
  note?: string;
}

// What the onboarding self-recording yields.
export interface IntroResult {
  owner: Owner;
  people: RelatedPerson[];
}

export interface OnboardResult {
  transcript: Transcript;
  intro: IntroResult;
  mocked: { transcript: boolean; intro: boolean };
}
