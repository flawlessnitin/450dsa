# Public DSA problem/topic pages for SEO

**Date:** 2026-06-18
**Status:** Approved

## Problem

The site (450dsa.flawlessnitin.com) is a personal progress tracker for the
"Final 450" DSA sheet. Today almost all of its content lives behind auth
(`/dashboard`), so there is nothing for search engines to index beyond the
homepage and `/login`:

- `app/sitemap.ts` lists only 2 URLs (`/`, `/login`).
- `app/robots.ts` disallows `/profile` and `/auth/`, but not `/dashboard`
  (which redirects anonymous visitors to `/login` anyway — pure crawl-budget
  waste).
- The 448-problem catalog (`data/problems.json`) and its 15 topics are only
  ever rendered inside the authenticated dashboard.

Competitors in this space (takeuforward.org, neetcode.io, GeeksforGeeks,
Coding Ninjas Studio) rank because they have large numbers of public,
crawlable, topically-organized pages. To compete for "450 dsa" and related
long-tail searches, this site needs an equivalent public surface.

## Goals

- Make every problem and every topic in the catalog reachable as a public,
  indexable page.
- Keep the new pages honest with search engines: no structured data or
  copy that overclaims what's actually on the page.
- Do this without duplicating the authenticated tracker UI or adding
  runtime cost — the catalog is static data already.

## Non-goals (v1)

- Writing original explanations/approach notes per problem (448 of them).
  Deferred — v1 problem pages are metadata + outbound links only.
- Letting users mark done/star from the public pages. Tracking stays in
  the existing authenticated dashboard.
- Difficulty tags or other catalog fields that don't exist in
  `data/problems.json` today.

## Design

### Routing & data model

- `lib/slug.ts` (new): `slugify(text)` — lowercase, strip punctuation,
  hyphenate.
- `lib/catalog.ts` gains:
  - `problemSlug(problem)` → `` `${id}-${slugify(title)}` `` (e.g.
    `12-reverse-the-array`)
  - `topicSlug(topic)` → `slugify(topic)` (e.g. `LinkedList` → `linkedlist`,
    `Searching & Sorting` → `searching-sorting`)
  - `topicBySlug`: reverse map from topic slug back to the canonical topic
    string.
- `app/problems/[slug]/page.tsx` (new): `generateStaticParams` returns
  `problemSlug()` for all 448 problems, so every problem page is
  prerendered at build time. The route parses the **leading numeric id**
  out of the slug param — that's the source of truth, not the trailing
  text. It looks the problem up by id and calls `notFound()` if no match.
  If the trailing text doesn't match what `problemSlug()` would generate
  for that problem today (e.g. the title was edited later), it issues a
  308 redirect to the canonical URL instead of serving a stale page, so
  existing inbound/external links never hard-break.
- `app/topics/[topic]/page.tsx` (new): `generateStaticParams` from the 15
  topics. Renders the topic's intro copy plus the full list of problems in
  that topic, each linking to its `/problems/[slug]` page.
- `app/topics/page.tsx` (new): index page linking to all 15 topic pages.
  Required so the new pages are reachable by a crawler following links,
  not only present in the sitemap.
- A "Browse the 450 DSA sheet" link is added to the login page, pointing
  at `/topics` — today there is no anonymous-reachable path into any
  catalog content from the site's actual UI.

### Page content, metadata & structured data

**Problem page** (`/problems/[slug]`):
- Content: title, topic (linked back to its topic page), outbound links
  (GeeksforGeeks always, LeetCode/Coding Ninjas when present in the data).
- `generateMetadata`: unique `<title>`
  (`${title} — ${topic} | Final 450 DSA Sheet`), description naming the
  topic and sheet, canonical URL, OpenGraph/Twitter tags — following the
  existing pattern in `app/u/[username]/page.tsx`.
- JSON-LD: `BreadcrumbList` only (Home → Topics → Topic → Problem). No
  `HowTo`/`Article`/`Question` schema — the page has no original
  explanation, and marking it up as more than link metadata risks a
  Google manual action for misleading structured data.

**Topic page** (`/topics/[topic]`):
- Content: a 3-5 line original intro (see Content authoring below) plus
  the full problem list for that topic.
- `generateMetadata` targets actual search phrasing ("Array interview
  questions", "LinkedList DSA practice").
- JSON-LD: `BreadcrumbList` + `ItemList` (each problem as a `ListItem`
  with `position`, `name`, `url`). Legitimate here since the page is
  genuinely a list of items.

**Topics index** (`/topics`):
- Grid/list of the 15 topics with problem counts, linking to each topic
  page. `BreadcrumbList` only.

### Sitemap, robots & internal linking

- `app/sitemap.ts` is rewritten to derive entries from `lib/catalog.ts`
  instead of 2 hardcoded URLs:
  - `/` — priority 1
  - `/topics` — priority 0.9
  - each `/topics/[slug]` (15) — priority 0.7
  - each `/problems/[slug]` (448) — priority 0.6
  - `/login` — priority 0.3
  - Total: 466 indexable URLs, up from 2.
- `app/robots.ts`: add `/dashboard` to the existing `disallow` list
  alongside `/profile` and `/auth/` (it's auth-gated and currently
  unlisted, so crawlers waste budget hitting a redirect).
- Internal linking: `/topics` index → topic pages → problem pages, with
  breadcrumbs linking back up. The new login-page link gives crawlers and
  humans an entry point from actual site navigation, not just the
  sitemap.

### Content authoring

Topic intros (15 total) are short — 3-5 lines, naming the topic + "Final
450 DSA sheet" (keyword + brand), describing the kind of problems covered,
no filler. Example style:

> **Array** — "Practice the most commonly asked Array questions from the
> Final 450 DSA sheet, covering rotations, searching, sorting, and
> subarray problems. Each question links to a GeeksforGeeks (and where
> available, LeetCode/Coding Ninjas) writeup so you can read the problem
> statement and attempt it directly."

Drafted during implementation, stored in a new `data/topicContent.ts`
(plain `Record<string, string>` keyed by topic name), editable by the
site owner afterward.

### Verification

- `npm run build` — confirms all 466 static params generate without
  error (catches slug collisions or bad data references).
- Local spot-check (`npm run dev`): one problem page, one topic page, the
  topics index, and the rendered `sitemap.xml` (entry count should jump
  from 2 to 466).
- Manually validate JSON-LD shape on one problem page and one topic page
  against the schema.org spec for `BreadcrumbList`/`ItemList`.
- Confirm `/dashboard` is now disallowed in `robots.txt` and existing
  protected-route redirects are unaffected.

## Alternatives considered

- **Dynamic (non-static) rendering** — rejected: no benefit, since the
  catalog has no per-request data source; static generation is strictly
  better here (zero runtime cost, CDN-cacheable).
- **Topic pages only, no per-problem route** — rejected: drops to ~16
  pages instead of 464, discarding the long-tail keyword surface (each
  problem title is itself a low-competition search query), which is the
  whole point of fixing the sitemap gap.
- **Original explanation per problem (448x)** — deferred to a future
  iteration; too large a content-writing effort for v1, and the topic-level
  intro content captures most of the realistic search-volume keywords
  already (individual problem titles have near-zero search volume on
  their own).
