// The static problem catalog. This is read-only reference data shipped with
// the app — only per-user progress lives in the database.
import problemsData from "@/data/problems.json";
import type { Problem } from "./types";
import { slugify } from "./slug";

export const problems = problemsData as Problem[];

export const totalCount = problems.length;

/** Topics in the order they first appear in the sheet. */
export const topics: string[] = Array.from(new Set(problems.map((p) => p.topic)));

/** Number of problems per topic, e.g. { Array: 36, ... }. */
export const topicCounts: Record<string, number> = problems.reduce(
  (acc, p) => {
    acc[p.topic] = (acc[p.topic] ?? 0) + 1;
    return acc;
  },
  {} as Record<string, number>,
);

/** Canonical public URL slug for a problem, e.g. "12-reverse-the-array". */
export function problemSlug(problem: Problem): string {
  return `${problem.id}-${slugify(problem.title)}`;
}

/** Canonical public URL slug for a topic, e.g. "linkedlist". */
export function topicSlug(topic: string): string {
  return slugify(topic);
}

/** Reverse lookup from a topic's URL slug back to its canonical name. */
export const topicBySlug: Record<string, string> = Object.fromEntries(
  topics.map((topic) => [topicSlug(topic), topic]),
);

/** All problems belonging to a given topic, in catalog order. */
export function problemsByTopic(topic: string): Problem[] {
  return problems.filter((p) => p.topic === topic);
}

/** Look up a single problem by its catalog id. */
export function problemById(id: number): Problem | undefined {
  return problems.find((p) => p.id === id);
}
