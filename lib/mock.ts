import type { Transcript, Chapter, IntroResult } from "./types";

// Used whenever real API keys are not configured, so the full UI flow
// works end-to-end before any provider is wired up.

export const MOCK_TRANSCRIPT: Transcript = {
  language: "en",
  segments: [
    { speaker: "interviewer", text: "Can you tell me what school was like for you back then?" },
    { speaker: "subject", text: "It was different then. We walked every morning — twenty minutes, maybe more in winter." },
    { speaker: "interviewer", text: "What do you remember about the building itself?" },
    { speaker: "subject", text: "The wooden desks. And the teacher had this blue ink bottle at the front. It made the whole room feel serious." },
    { speaker: "interviewer", text: "Was it strict?" },
    { speaker: "subject", text: "Very. But not cruel. You sat straight, you listened. Still, there were ways around it — who could make you laugh without moving their mouth." },
    { speaker: "interviewer", text: "And after school?" },
    { speaker: "subject", text: "We ran. Out the gate and gone. Uncle Paul used to hide his report card under the fence post. We teased him about that for forty years." },
  ],
};

// Onboarding self-introduction (solo speaker).
export const MOCK_INTRO_TRANSCRIPT: Transcript = {
  language: "en",
  segments: [
    { speaker: "subject", text: "My name is Friedrich. I was born in 1939 in Hamburg." },
    { speaker: "subject", text: "My father was Otto and my mother was Maria." },
    { speaker: "subject", text: "I have a younger sister, Anna." },
    { speaker: "subject", text: "My wife is Elke. We have two children, Klaus and Birgit." },
    { speaker: "subject", text: "Birgit has a little boy now — my grandson, Max." },
  ],
};

export const MOCK_INTRO: IntroResult = {
  owner: { name: "Friedrich", bornYear: "1939", bornPlace: "Hamburg" },
  people: [
    { name: "Otto", relation: "parent" },
    { name: "Maria", relation: "parent" },
    { name: "Anna", relation: "sibling", note: "younger sister" },
    { name: "Elke", relation: "spouse" },
    { name: "Klaus", relation: "child" },
    { name: "Birgit", relation: "child" },
    { name: "Max", relation: "grandchild", note: "Birgit's son" },
  ],
};

export const MOCK_CHAPTER: Chapter = {
  topic: "School",
  title: "The Walk to School",
  language: "en",
  style_params: {
    descriptiveness: "medium",
    sentence_length: "medium",
    emotional_register: "warm",
  },
  entities: [
    { type: "person", name: "Uncle Paul" },
    { type: "place", name: "the schoolhouse" },
    { type: "theme", name: "childhood" },
  ],
  prose: `The walk to school felt longer in those days, though it could not have been more than twenty minutes. I remember the sound of my shoes on the pavement and the way I tried to arrive with my hair still combed, even when the wind had other plans.

Our classroom had wooden desks with small scratches from generations before us. There was a blue ink bottle near the teacher's table, and somehow that bottle made the whole room feel serious. We were expected to sit straight, listen carefully, and not waste words.

Still, school was not only strictness. It was the place where I learned who could make me laugh without moving their mouth, who would share a pencil, and who was brave enough to ask a question when the rest of us were pretending to understand.`,
};
