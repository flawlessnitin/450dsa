# Public Problem/Topic SEO Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the 448-problem / 15-topic catalog as statically-generated, publicly indexable pages (`/problems/[slug]`, `/topics/[topic]`, `/topics`) so search engines have ~466 crawlable URLs instead of 2.

**Architecture:** Pure static generation (`generateStaticParams`) over the existing build-time catalog in `lib/catalog.ts` — no new data sources, no runtime DB calls, no client-side state. New pages are server components that render catalog data + a short editorial intro (topics only) + honest JSON-LD (`BreadcrumbList`/`ItemList`, never schema types that overclaim what's on the page).

**Tech Stack:** Next.js 16.2.9 (App Router), TypeScript, Tailwind CSS — no new dependencies.

## Global Constraints

- Catalog facts (verified against `data/problems.json`): 448 problems, ids 1–448 all unique, 15 distinct topics: `Array, Matrix, String, Searching & Sorting, LinkedList, Binary Trees, Binary Search Trees, Greedy, BackTracking, Stacks & Queues, Heap, Graph, Trie, Dynamic Programming, Bit Manipulation`.
- Problem slug format: `` `${id}-${slugify(title)}` `` — id is always the lookup source of truth, never the trailing text.
- Topic slug format: `slugify(topic)`.
- Sitemap priorities (exact): `/` → 1, `/topics` → 0.9, each `/topics/[slug]` → 0.7, each `/problems/[slug]` → 0.6, `/login` → 0.3. Total entries: 466.
- `app/robots.ts` disallow list must include `/profile`, `/auth/`, and `/dashboard` (the third is new).
- Problem pages get `BreadcrumbList` JSON-LD only — never `HowTo`/`Article`/`Question` schema (no original explanation content exists on these pages).
- Topic pages get `BreadcrumbList` + `ItemList` JSON-LD.
- No done/star/auth interaction on any of these new pages — they are fully static and identical for every visitor.
- **No test framework exists in this repo** (`package.json` has no `vitest`/`jest`, no `__tests__` anywhere outside `node_modules`). Per-task verification therefore uses `npx tsc --noEmit` (type-check) and `npm run build` (validates `generateStaticParams` actually produces correct, collision-free routes) instead of a unit-test runner — this matches the repo's existing convention (zero automated tests; correctness is enforced via TypeScript + manual build/dev verification) and the spec's own Verification section. Do not introduce a test framework as part of this plan.
- Follow existing code conventions: double-quoted strings, semicolons, `@/`-prefixed absolute imports, Tailwind zinc/indigo palette matching `app/login/page.tsx` and `app/u/[username]/page.tsx`.

---

### Task 1: Slug helper

**Files:**
- Create: `lib/slug.ts`

**Interfaces:**
- Produces: `slugify(text: string): string` — lowercase, non-alphanumeric runs collapsed to a single `-`, no leading/trailing `-`.

- [ ] **Step 1: Write `lib/slug.ts`**

```ts
/** Convert arbitrary text into a lowercase, hyphenated, URL-safe slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual sanity check**

Node can't `require()` a `.ts` file directly, so this check runs the same one-line logic from Step 1 inline against tricky real titles, rather than importing the module:

Run:
```bash
node -e "
const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
console.log(slugify('Find the \"Kth\" max and min element of an array'));
console.log(slugify('Searching & Sorting'));
console.log(slugify('Why Quicksort is preferred for. Arrays and Merge Sort for LinkedLists ?'));
"
```

Expected output:
```
find-the-kth-max-and-min-element-of-an-array
searching-sorting
why-quicksort-is-preferred-for-arrays-and-merge-sort-for-linkedlists
```

(This inline copy mirrors the logic in `lib/slug.ts` only because there's no test runner to import the real module directly — it's a one-off sanity check, not a substitute for Step 2's type-check or the build verification in Task 6.)

- [ ] **Step 4: Commit**

```bash
git add lib/slug.ts
git commit -m "feat: add slugify helper for public problem/topic URLs"
```

---

### Task 2: Catalog helpers for slugs and topic lookups

**Files:**
- Modify: `lib/catalog.ts`

**Interfaces:**
- Consumes: `slugify(text: string): string` from Task 1 (`lib/slug.ts`).
- Produces:
  - `problemSlug(problem: Problem): string`
  - `topicSlug(topic: string): string`
  - `topicBySlug: Record<string, string>`
  - `problemsByTopic(topic: string): Problem[]`
  - `problemById(id: number): Problem | undefined`

- [ ] **Step 1: Add the helpers to `lib/catalog.ts`**

Current end of file (after `topicCounts`) — append:

```ts
import { slugify } from "./slug";

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
```

The `import { slugify } from "./slug";` line goes at the top of the file alongside the existing imports, not at the end — place it directly below `import type { Problem } from "./types";`.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify topic slugs are unique**

Run:
```bash
node -e "
const d = require('./data/problems.json');
const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+\$/g, '');
const topics = [...new Set(d.map(p => p.topic))];
const slugs = topics.map(slugify);
console.log('topics:', topics.length, 'unique slugs:', new Set(slugs).size);
console.log(slugs.join(', '));
"
```
Expected: `topics: 15 unique slugs: 15` and 15 distinct slug strings printed (confirms no two topics collapse to the same slug, e.g. `LinkedList` and `Linked List` would collide — they don't both exist in this data, but this step proves it for the real data, not an assumption).

- [ ] **Step 4: Commit**

```bash
git add lib/catalog.ts
git commit -m "feat: add problem/topic slug and lookup helpers to catalog"
```

---

### Task 3: Shared base URL constant

**Files:**
- Create: `lib/site.ts`
- Modify: `app/robots.ts`

**Interfaces:**
- Produces: `baseUrl: string`

This removes the `process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"` duplication that currently lives in both `app/sitemap.ts` and `app/robots.ts`, and that the new pages in Tasks 6–8 also need — extracted now since Task 4 (`robots.ts` is already being modified here for the `/dashboard` disallow) touches one of the two existing copies.

- [ ] **Step 1: Write `lib/site.ts`**

```ts
/** Public base URL of the deployed site, used for canonical links and JSON-LD. */
export const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
```

- [ ] **Step 2: Update `app/robots.ts` to use it and disallow `/dashboard`**

Replace the full file content:

```ts
import { MetadataRoute } from "next";
import { baseUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profile", "/auth/", "/dashboard"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Verify robots output**

Run: `npm run dev` in one terminal, then in another: `curl -s http://localhost:3000/robots.txt`
Expected output includes:
```
Disallow: /profile
Disallow: /auth/
Disallow: /dashboard
```
Stop the dev server after checking.

- [ ] **Step 5: Commit**

```bash
git add lib/site.ts app/robots.ts
git commit -m "fix: disallow /dashboard in robots.txt and extract shared baseUrl"
```

---

### Task 4: JSON-LD helpers and component

**Files:**
- Create: `lib/seo.ts`
- Create: `components/JsonLd.tsx`

**Interfaces:**
- Produces:
  - `breadcrumbJsonLd(items: { name: string; url: string }[]): object`
  - `itemListJsonLd(items: { name: string; url: string }[]): object`
  - `JsonLd({ data }: { data: object }): JSX.Element` (default export)

- [ ] **Step 1: Write `lib/seo.ts`**

```ts
type LinkItem = { name: string; url: string };

/** schema.org BreadcrumbList for a page's position in the site hierarchy. */
export function breadcrumbJsonLd(items: LinkItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** schema.org ItemList for a page that genuinely lists a set of items. */
export function itemListJsonLd(items: LinkItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
```

- [ ] **Step 2: Write `components/JsonLd.tsx`**

```tsx
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no errors on the two new files (confirms `dangerouslySetInnerHTML` doesn't trip the project's ESLint config).

- [ ] **Step 5: Commit**

```bash
git add lib/seo.ts components/JsonLd.tsx
git commit -m "feat: add JSON-LD breadcrumb/itemlist helpers and component"
```

---

### Task 5: Topic intro content

**Files:**
- Create: `data/topicContent.ts`

**Interfaces:**
- Produces: `topicContent: Record<string, string>` keyed by the exact topic strings used in `data/problems.json`.

- [ ] **Step 1: Write `data/topicContent.ts`**

```ts
/** Short, original intro copy for each topic's public page (data/problems.json topic values). */
export const topicContent: Record<string, string> = {
  Array:
    "Practice the most commonly asked Array questions from the Final 450 DSA sheet, covering rotations, searching, sorting, and subarray problems. Each question links to GeeksforGeeks and, where available, LeetCode or Coding Ninjas, so you can read the problem statement and attempt it directly.",
  Matrix:
    "Matrix questions from the Final 450 DSA sheet — traversal, rotation, searching, and spiral or diagonal patterns that show up often in coding interviews. Solve each one on GeeksforGeeks, LeetCode, or Coding Ninjas, then track your progress on the Final 450 tracker.",
  String:
    "String manipulation questions from the Final 450 DSA sheet, covering pattern matching, palindromes, anagrams, and parsing problems frequently asked in interviews. Each question links to GeeksforGeeks and, where available, LeetCode or Coding Ninjas.",
  "Searching & Sorting":
    "Searching and sorting questions from the Final 450 DSA sheet — binary search variants, custom comparators, and classic sorting algorithms asked across interview rounds. Work through each one on GeeksforGeeks, LeetCode, or Coding Ninjas.",
  LinkedList:
    "LinkedList interview questions from the Final 450 sheet — reversal, cycle detection, merging, and other classic patterns asked in DSA interviews. Solve each one on GeeksforGeeks, LeetCode, or Coding Ninjas, then track your progress here.",
  "Binary Trees":
    "Binary Tree questions from the Final 450 DSA sheet, covering traversals, height and diameter problems, and tree construction — staples of any DSA interview. Each links to GeeksforGeeks and, where available, LeetCode or Coding Ninjas.",
  "Binary Search Trees":
    "Binary Search Tree questions from the Final 450 DSA sheet, covering insertion, deletion, validation, and BST-specific traversal problems. Practice each one on GeeksforGeeks, LeetCode, or Coding Ninjas.",
  Greedy:
    "Greedy algorithm questions from the Final 450 DSA sheet — interval scheduling, activity selection, and other problems solved by making the locally optimal choice at each step. Each links to GeeksforGeeks, LeetCode, or Coding Ninjas.",
  BackTracking:
    "Backtracking questions from the Final 450 DSA sheet, covering permutations, combinations, N-Queens-style puzzles, and constraint-satisfaction problems. Solve each one on GeeksforGeeks, LeetCode, or Coding Ninjas.",
  "Stacks & Queues":
    "Stack and Queue questions from the Final 450 DSA sheet — parenthesis matching, monotonic stacks, and queue-based simulation problems common in interviews. Each links to GeeksforGeeks and, where available, LeetCode or Coding Ninjas.",
  Heap:
    "Heap and priority-queue questions from the Final 450 DSA sheet, covering k-largest and k-smallest problems, median-finding, and heap-based scheduling. Practice each one on GeeksforGeeks, LeetCode, or Coding Ninjas.",
  Graph:
    "Graph questions from the Final 450 DSA sheet — BFS and DFS traversal, shortest paths, cycle detection, and topological sorting, all frequently asked in interviews. Each links to GeeksforGeeks, LeetCode, or Coding Ninjas.",
  Trie:
    "Trie questions from the Final 450 DSA sheet, covering prefix search, autocomplete-style lookups, and word-dictionary problems. Solve each one on GeeksforGeeks or Coding Ninjas and track your progress here.",
  "Dynamic Programming":
    "Dynamic Programming questions from the Final 450 DSA sheet — the largest topic in the sheet, covering knapsack variants, string DP, and optimal substructure problems that come up constantly in interviews. Each links to GeeksforGeeks, LeetCode, or Coding Ninjas.",
  "Bit Manipulation":
    "Bit Manipulation questions from the Final 450 DSA sheet, covering XOR tricks, bitmasking, and low-level number problems often used as quick interview warm-ups. Practice each one on GeeksforGeeks, LeetCode, or Coding Ninjas.",
};
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify all 15 catalog topics have an entry**

Node can't `require()` a `.ts` file directly, so this check reads `topicContent.ts` as plain text and confirms every catalog topic name appears in it, rather than importing the module:

Run:
```bash
node -e "
const fs = require('fs');
const d = require('./data/problems.json');
const topics = [...new Set(d.map(p => p.topic))];
const src = fs.readFileSync('./data/topicContent.ts', 'utf8');
const missing = topics.filter(t => !src.includes(JSON.stringify(t)) && !src.includes(t));
console.log('topics:', topics.length, 'missing from topicContent.ts:', missing);
"
```
Expected: `topics: 15 missing from topicContent.ts: []`

- [ ] **Step 4: Commit**

```bash
git add data/topicContent.ts
git commit -m "feat: add original intro copy for all 15 topic pages"
```

---

### Task 6: Public problem page

**Files:**
- Create: `app/problems/[slug]/page.tsx`

**Interfaces:**
- Consumes: `problems`, `problemSlug`, `topicSlug` from `lib/catalog` (Task 2); `breadcrumbJsonLd` from `lib/seo` (Task 4); `baseUrl` from `lib/site` (Task 3); `JsonLd` from `components/JsonLd` (Task 4).

- [ ] **Step 1: Write `app/problems/[slug]/page.tsx`**

```tsx
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { problems, problemSlug, topicSlug } from "@/lib/catalog";
import { breadcrumbJsonLd } from "@/lib/seo";
import { baseUrl } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

type Params = { params: Promise<{ slug: string }> };

function parseLeadingId(slug: string): number | null {
  const match = /^(\d+)-/.exec(slug);
  return match ? Number(match[1]) : null;
}

function getProblemBySlug(slug: string) {
  const id = parseLeadingId(slug);
  if (id === null) return null;
  return problems.find((p) => p.id === id) ?? null;
}

export function generateStaticParams() {
  return problems.map((p) => ({ slug: problemSlug(p) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const problem = getProblemBySlug(slug);
  if (!problem) return { title: "Problem not found" };

  const title = `${problem.title} — ${problem.topic} | Final 450 DSA Sheet`;
  const description = `Solve "${problem.title}", a ${problem.topic} question from the Final 450 DSA sheet. Practice on GeeksforGeeks, LeetCode, or Coding Ninjas and track your progress.`;
  const canonical = `/problems/${problemSlug(problem)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProblemPage({ params }: Params) {
  const { slug } = await params;
  const problem = getProblemBySlug(slug);
  if (!problem) notFound();

  const canonicalSlug = problemSlug(problem);
  if (slug !== canonicalSlug) {
    permanentRedirect(`/problems/${canonicalSlug}`);
  }

  const links = [
    { label: "GeeksforGeeks", value: problem.url },
    { label: "LeetCode", value: problem.leetcodeUrl },
    { label: "Coding Ninjas", value: problem.codingNinjaUrl },
  ].filter((l): l is { label: string; value: string } => Boolean(l.value));

  const topicHref = `/topics/${topicSlug(problem.topic)}`;
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: baseUrl },
    { name: "Topics", url: `${baseUrl}/topics` },
    { name: problem.topic, url: `${baseUrl}${topicHref}` },
    { name: problem.title, url: `${baseUrl}/problems/${canonicalSlug}` },
  ]);

  return (
    <main className="flex flex-1 items-start justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <nav className="mb-4 text-xs text-zinc-500">
          <Link href="/topics" className="hover:text-indigo-600">
            Topics
          </Link>
          {" / "}
          <Link href={topicHref} className="hover:text-indigo-600">
            {problem.topic}
          </Link>
        </nav>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
            {problem.topic}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">{problem.title}</h1>

          {links.length > 0 ? (
            <>
              <p className="mt-4 text-sm text-zinc-600">
                Part of the Final 450 DSA sheet. Solve it on one of the links below, then{" "}
                <Link href="/login" className="text-indigo-600 hover:underline">
                  sign up to track your progress
                </Link>
                .
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {links.map((l) => (
                  <a
                    key={l.label}
                    href={l.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:border-indigo-300 hover:text-indigo-600"
                  >
                    {l.label} ↗
                  </a>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-zinc-600">
              This is a conceptual question with no single practice link — see the{" "}
              <Link href={topicHref} className="text-indigo-600 hover:underline">
                {problem.topic} topic page
              </Link>{" "}
              for related practice problems.
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-zinc-400">
          <Link href="/" className="hover:text-zinc-600">
            Final 450 — DSA Tracker
          </Link>
        </p>
      </div>
      <JsonLd data={breadcrumb} />
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Build and verify all 448 problem pages generate**

Run: `npm run build`
Expected: build succeeds; output log shows the `/problems/[slug]` route with 448 generated paths (Next prints a route summary table — confirm `/problems/[slug]` is listed as a static/SSG route, not dynamic).

- [ ] **Step 4: Spot-check one page, including the no-links edge case**

Run: `npm run dev`, then in a browser visit:
- `http://localhost:3000/problems/1-reverse-the-array` — expect title "Reverse the array", topic "Array", a GeeksforGeeks/LeetCode/Coding Ninjas link row.
- `http://localhost:3000/problems/50-why-strings-are-immutable-in-java` — expect the "no single practice link" fallback message instead of an empty link row.

Stop the dev server after checking.

- [ ] **Step 5: Commit**

```bash
git add app/problems
git commit -m "feat: add public, statically-generated problem pages"
```

---

### Task 7: Public topic page

**Files:**
- Create: `app/topics/[topic]/page.tsx`

**Interfaces:**
- Consumes: `topics`, `topicBySlug`, `topicSlug`, `problemSlug`, `problemsByTopic`, `topicCounts` from `lib/catalog` (Task 2); `topicContent` from `data/topicContent` (Task 5); `breadcrumbJsonLd`, `itemListJsonLd` from `lib/seo` (Task 4); `baseUrl` from `lib/site` (Task 3); `JsonLd` from `components/JsonLd` (Task 4).

- [ ] **Step 1: Write `app/topics/[topic]/page.tsx`**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  topics,
  topicBySlug,
  topicSlug,
  problemSlug,
  problemsByTopic,
  topicCounts,
} from "@/lib/catalog";
import { topicContent } from "@/data/topicContent";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { baseUrl } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

type Params = { params: Promise<{ topic: string }> };

export function generateStaticParams() {
  return topics.map((topic) => ({ topic: topicSlug(topic) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = topicBySlug[slug];
  if (!topic) return { title: "Topic not found" };

  const title = `${topic} DSA Questions — Final 450 Sheet`;
  const description = `${topicCounts[topic]} ${topic} questions from the Final 450 DSA sheet, with links to GeeksforGeeks, LeetCode, and Coding Ninjas.`;
  const canonical = `/topics/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TopicPage({ params }: Params) {
  const { topic: slug } = await params;
  const topic = topicBySlug[slug];
  if (!topic) notFound();

  const topicProblems = problemsByTopic(topic);
  const intro = topicContent[topic] ?? `${topic} questions from the Final 450 DSA sheet.`;

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: baseUrl },
    { name: "Topics", url: `${baseUrl}/topics` },
    { name: topic, url: `${baseUrl}/topics/${slug}` },
  ]);
  const itemList = itemListJsonLd(
    topicProblems.map((p) => ({
      name: p.title,
      url: `${baseUrl}/problems/${problemSlug(p)}`,
    })),
  );

  return (
    <main className="flex flex-1 items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <nav className="mb-4 text-xs text-zinc-500">
          <Link href="/topics" className="hover:text-indigo-600">
            Topics
          </Link>
        </nav>

        <h1 className="text-2xl font-semibold text-zinc-900">{topic}</h1>
        <p className="mt-2 text-sm text-zinc-600">{intro}</p>

        <ul className="mt-6 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
          {topicProblems.map((p) => (
            <li key={p.id}>
              <Link
                href={`/problems/${problemSlug(p)}`}
                className="block px-4 py-3 text-sm text-zinc-700 transition hover:bg-zinc-50 hover:text-indigo-600"
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <JsonLd data={breadcrumb} />
      <JsonLd data={itemList} />
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Build and verify all 15 topic pages generate**

Run: `npm run build`
Expected: build succeeds; route summary shows `/topics/[topic]` generated for 15 paths.

- [ ] **Step 4: Spot-check**

Run: `npm run dev`, visit `http://localhost:3000/topics/array` — expect the Array intro paragraph followed by a list of 36 problems, each linking to its own `/problems/[slug]` page. Stop the dev server after checking.

- [ ] **Step 5: Commit**

```bash
git add app/topics/\[topic\]
git commit -m "feat: add public, statically-generated topic pages"
```

---

### Task 8: Topics index page

**Files:**
- Create: `app/topics/page.tsx`

**Interfaces:**
- Consumes: `topics`, `topicSlug`, `topicCounts`, `totalCount` from `lib/catalog` (Task 2); `breadcrumbJsonLd` from `lib/seo` (Task 4); `baseUrl` from `lib/site` (Task 3); `JsonLd` from `components/JsonLd` (Task 4).

- [ ] **Step 1: Write `app/topics/page.tsx`**

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { topics, topicSlug, topicCounts, totalCount } from "@/lib/catalog";
import { breadcrumbJsonLd } from "@/lib/seo";
import { baseUrl } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

const title = "Browse the Final 450 DSA Sheet by Topic";
const description = `All ${totalCount} questions from the Final 450 DSA sheet, organized into ${topics.length} topics — Array, Graph, Dynamic Programming, and more.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/topics" },
  openGraph: { title, description, url: "/topics", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function TopicsIndexPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: baseUrl },
    { name: "Topics", url: `${baseUrl}/topics` },
  ]);

  return (
    <main className="flex flex-1 items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Final 450 DSA Sheet — Browse by Topic
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          {totalCount} questions across {topics.length} topics. Pick a topic to see its
          questions and links to GeeksforGeeks, LeetCode, and Coding Ninjas.
        </p>

        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <li key={topic}>
              <Link
                href={`/topics/${topicSlug(topic)}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-300"
              >
                <span className="font-medium text-zinc-900">{topic}</span>
                <span className="ml-2 text-sm text-zinc-400">
                  {topicCounts[topic]} questions
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <JsonLd data={breadcrumb} />
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds; `/topics` listed as a static route.

- [ ] **Step 4: Spot-check**

Run: `npm run dev`, visit `http://localhost:3000/topics` — expect 15 topic cards with correct counts (Array 36, Dynamic Programming 60, Trie 6, etc.). Stop the dev server after checking.

- [ ] **Step 5: Commit**

```bash
git add app/topics/page.tsx
git commit -m "feat: add topics index page"
```

---

### Task 9: Dynamic sitemap

**Files:**
- Modify: `app/sitemap.ts`

**Interfaces:**
- Consumes: `problems`, `topics`, `problemSlug`, `topicSlug` from `lib/catalog` (Task 2); `baseUrl` from `lib/site` (Task 3).

- [ ] **Step 1: Replace `app/sitemap.ts`**

```ts
import { MetadataRoute } from "next";
import { problems, topics, problemSlug, topicSlug } from "@/lib/catalog";
import { baseUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const root: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/topics`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const topicEntries: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: `${baseUrl}/topics/${topicSlug(topic)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const problemEntries: MetadataRoute.Sitemap = problems.map((problem) => ({
    url: `${baseUrl}/problems/${problemSlug(problem)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...root, ...topicEntries, ...problemEntries];
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify entry count**

Run: `npm run dev`, then in another terminal: `curl -s http://localhost:3000/sitemap.xml | grep -c '<loc>'`
Expected: `466` (1 root + 1 topics index + 15 topics + 448 problems + 1 login).
Stop the dev server after checking.

- [ ] **Step 4: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat: generate sitemap entries for all problem and topic pages"
```

---

### Task 10: Internal link from the login page

**Files:**
- Modify: `app/login/page.tsx:172-180` (the existing "Back to problems" footer link block)

**Interfaces:**
- None (presentational only).

- [ ] **Step 1: Add a "Browse the 450 DSA sheet" link**

Replace:

```tsx
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-zinc-500 transition hover:text-indigo-600"
            >
              ← Back to problems
            </Link>
          </div>
```

with:

```tsx
          <div className="mt-4 flex items-center justify-center gap-4 text-center">
            <Link
              href="/"
              className="text-sm text-zinc-500 transition hover:text-indigo-600"
            >
              ← Back to problems
            </Link>
            <Link
              href="/topics"
              className="text-sm text-zinc-500 transition hover:text-indigo-600"
            >
              Browse the 450 DSA sheet
            </Link>
          </div>
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Spot-check**

Run: `npm run dev`, visit `http://localhost:3000/login`, confirm the "Browse the 450 DSA sheet" link is visible and navigates to `/topics`. Stop the dev server after checking.

- [ ] **Step 4: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: link to the public topics index from the login page"
```

---

### Task 11: Full build verification and JSON-LD validation

**Files:** none (verification only).

- [ ] **Step 1: Full production build**

Run: `npm run build`
Expected: build succeeds with zero errors; route summary shows `/problems/[slug]` (448 paths), `/topics/[topic]` (15 paths), and `/topics` as generated static routes.

- [ ] **Step 2: Run the linter across the whole repo**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Start the production server and check the sitemap and robots**

Run: `npm run start` (after `npm run build`), then in another terminal:
```bash
curl -s http://localhost:3000/sitemap.xml | grep -c '<loc>'
curl -s http://localhost:3000/robots.txt
```
Expected: `466` for the sitemap count; robots output disallows `/profile`, `/auth/`, `/dashboard`.

- [ ] **Step 4: Validate JSON-LD shape on one problem and one topic page**

Run:
```bash
curl -s http://localhost:3000/problems/1-reverse-the-array | grep -o '<script type="application/ld+json">.*</script>'
curl -s http://localhost:3000/topics/array | grep -o '<script type="application/ld+json">.*</script>'
```
Expected: the problem page prints one `BreadcrumbList` JSON object with 4 `ListItem` entries (Home, Topics, Array, Reverse the array). The topic page prints two script tags — a `BreadcrumbList` with 3 entries and an `ItemList` with 36 entries (one per Array problem). Manually inspect the printed JSON against the schema.org `BreadcrumbList`/`ItemList` shape (each `ListItem` has `position`, `name`, and `item`/`url`).

- [ ] **Step 5: Stop the production server**

Stop the `npm run start` process started in Step 3.

- [ ] **Step 6: Update README project structure**

`README.md:97-125` documents the `app/` tree. Add the three new routes to keep it accurate:

```
  problems/[slug]/page.tsx # public problem page (SEO, static)
  topics/page.tsx       # public topics index (SEO, static)
  topics/[topic]/page.tsx # public topic page (SEO, static)
```

Insert these lines into the existing tree, immediately after the `u/[username]/page.tsx` line, and add `data/topicContent.ts` after the `data/problems.json` line, and `lib/slug.ts`, `lib/seo.ts`, `lib/site.ts` after `lib/catalog.ts`.

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs: document the new public SEO routes in the project structure"
```

## Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-06-18-public-dsa-pages-seo-design.md` maps to a task — routing/slugs (Tasks 1-2, 6-8), metadata/JSON-LD (Tasks 4, 6-8), sitemap/robots/internal linking (Tasks 3, 9-10), content authoring (Task 5), verification (Task 11).
- **Placeholder scan:** no TBD/TODO; the one inline "sanity check" duplication in Task 1 Step 3 is explicitly justified (no test runner to import the real module) rather than left unexplained.
- **Type consistency:** `problemSlug`, `topicSlug`, `topicBySlug`, `problemsByTopic`, `problemById` are defined once in Task 2 and referenced with identical names/signatures in every later task that imports them.
