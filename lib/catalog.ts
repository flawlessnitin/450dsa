// The static problem catalog, extracted from FINAL450.xlsx by scripts/extract.py.
// This is read-only reference data shipped with the app — only per-user progress
// lives in the database.
import problemsData from "@/data/problems.json";
import type { Problem } from "./types";

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
