"use client";

import type { Owner, RelatedPerson, Relation, IntroResult } from "./types";

// Client-side family store (localStorage). Holds the owner + the people they
// mentioned, forming a starter family tree. Each person's name doubles as the
// key for their "Story" (recordings) in lib/store.ts.

export interface Person extends RelatedPerson {
  id: string;
}

export interface Family {
  owner: Owner;
  people: Person[];
  createdAt: number;
}

const KEY = "memoir.family";

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Math.random()).slice(2);
}

export function loadFamily(): Family | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Family) : null;
  } catch {
    return null;
  }
}

export function hasFamily(): boolean {
  return loadFamily() !== null;
}

export function saveFamily(f: Family) {
  localStorage.setItem(KEY, JSON.stringify(f));
}

// Build a fresh family from the onboarding extraction.
export function createFamilyFromIntro(intro: IntroResult): Family {
  const family: Family = {
    owner: intro.owner,
    people: intro.people.map((p) => ({ ...p, id: uid() })),
    createdAt: Date.now(),
  };
  saveFamily(family);
  return family;
}

export function addPerson(name: string, relation: Relation): Person {
  const f = loadFamily() ?? { owner: { name: "You" }, people: [], createdAt: Date.now() };
  const person: Person = { id: uid(), name, relation };
  f.people.push(person);
  saveFamily(f);
  return person;
}

// Group people by relation for the tree reveal.
export const RELATION_ORDER: Relation[] = [
  "parent",
  "grandparent",
  "sibling",
  "spouse",
  "child",
  "grandchild",
  "other",
];

export const RELATION_LABEL: Record<Relation, string> = {
  self: "You",
  parent: "Parents",
  grandparent: "Grandparents",
  sibling: "Siblings",
  spouse: "Partner",
  child: "Children",
  grandchild: "Grandchildren",
  other: "Others",
};
