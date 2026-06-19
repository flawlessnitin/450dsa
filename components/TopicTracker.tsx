"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { problemsByTopic, topicCounts } from "@/lib/catalog";
import type { ProgressRow, StatusFilter } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import FilterBar from "./FilterBar";
import TopicSection from "./TopicSection";
import SignInPrompt from "./SignInPrompt";

type Entry = { done: boolean; starred: boolean; note: string };
type ProgressMap = Record<number, Entry>;

const EMPTY: Entry = { done: false, starred: false, note: "" };

function buildMap(rows: ProgressRow[]): ProgressMap {
  const map: ProgressMap = {};
  for (const r of rows) {
    map[r.problem_id] = { done: r.done, starred: r.starred, note: r.note ?? "" };
  }
  return map;
}

// The same interactive section used on the dashboard, embedded directly on a
// topic's own public page. Stays a client island so the page itself remains
// statically generated — this self-fetches auth + progress client-side,
// mirroring SiteHeader's pattern, instead of redirecting elsewhere.
export default function TopicTracker({ topic }: { topic: string }) {
  const supabase = useMemo(() => createClient(), []);
  const topicProblems = useMemo(() => problemsByTopic(topic), [topic]);
  const { userId, loading: authLoading } = useAuth();

  const [progress, setProgress] = useState<ProgressMap>({});
  const progressRef = useRef<ProgressMap>({});
  const [progressLoaded, setProgressLoaded] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [collapsed, setCollapsed] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const noteTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Auth state (and its one-time fetch) lives in AuthProvider. Once it
  // resolves: a guest has nothing to load (mark loaded immediately), a real
  // user's progress is fetched here before the checkboxes are ever shown —
  // otherwise they'd briefly render as unchecked and then flip, which reads
  // as a bug rather than a loading state.
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgressLoaded(true);
      return;
    }
    let active = true;

    supabase
      .from("progress")
      .select("problem_id, done, starred, note")
      .then(({ data }) => {
        if (!active) return;
        const map = buildMap((data ?? []) as ProgressRow[]);
        progressRef.current = map;
        setProgress(map);
        setProgressLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [supabase, userId, authLoading]);

  const loading = authLoading || !progressLoaded;

  useEffect(() => {
    const timers = noteTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const writeRow = useCallback(
    async (id: number, entry: Entry) => {
      if (!userId) return;
      const { error } = await supabase.from("progress").upsert(
        {
          user_id: userId,
          problem_id: id,
          done: entry.done,
          starred: entry.starred,
          note: entry.note ? entry.note : null,
        },
        { onConflict: "user_id,problem_id" },
      );
      setSaveError(
        error ? "Couldn't sync your latest change — check your connection." : null,
      );
    },
    [supabase, userId],
  );

  const apply = useCallback((id: number, patch: Partial<Entry>) => {
    setProgress((prev) => {
      const current = prev[id] ?? EMPTY;
      const updated = { ...prev, [id]: { ...current, ...patch } };
      progressRef.current = updated;
      return updated;
    });
  }, []);

  const onToggleDone = useCallback(
    (id: number) => {
      if (!userId) {
        setShowSignInPrompt(true);
        return;
      }
      const next = {
        ...(progressRef.current[id] ?? EMPTY),
        done: !(progressRef.current[id] ?? EMPTY).done,
      };
      apply(id, { done: next.done });
      writeRow(id, next);
    },
    [userId, apply, writeRow],
  );

  const onToggleStar = useCallback(
    (id: number) => {
      if (!userId) {
        setShowSignInPrompt(true);
        return;
      }
      const next = {
        ...(progressRef.current[id] ?? EMPTY),
        starred: !(progressRef.current[id] ?? EMPTY).starred,
      };
      apply(id, { starred: next.starred });
      writeRow(id, next);
    },
    [userId, apply, writeRow],
  );

  const onNoteChange = useCallback(
    (id: number, note: string) => {
      if (!userId) {
        setShowSignInPrompt(true);
        return;
      }
      apply(id, { note });
      clearTimeout(noteTimers.current[id]);
      noteTimers.current[id] = setTimeout(() => {
        writeRow(id, progressRef.current[id] ?? { ...EMPTY, note });
      }, 600);
    },
    [userId, apply, writeRow],
  );

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return topicProblems
      .map((p) => {
        const e = progress[p.id] ?? EMPTY;
        return { ...p, done: e.done, starred: e.starred, note: e.note };
      })
      .filter((p) => {
        if (q && !p.title.toLowerCase().includes(q)) return false;
        if (status === "pending") return !p.done;
        if (status === "done") return p.done;
        if (status === "starred") return p.starred;
        return true;
      });
  }, [topicProblems, progress, search, status]);

  const doneCount = useMemo(
    () => topicProblems.filter((p) => progress[p.id]?.done).length,
    [topicProblems, progress],
  );

  return (
    <div>
      <div className="mb-4">
        <FilterBar
          search={search}
          onSearch={setSearch}
          status={status}
          onStatus={setStatus}
          showTopicFilter={false}
          showExpandCollapse={false}
        />
      </div>

      {saveError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {saveError}
        </p>
      )}

      {loading ? (
        <TopicSectionSkeleton />
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white py-12 text-center text-sm text-zinc-500">
          No problems match your filters.
        </p>
      ) : (
        <TopicSection
          topic={topic}
          items={items}
          doneCount={doneCount}
          total={topicCounts[topic]}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onToggleDone={onToggleDone}
          onToggleStar={onToggleStar}
          onNoteChange={onNoteChange}
          linkToTopicPage={false}
        />
      )}

      {showSignInPrompt && (
        <SignInPrompt onClose={() => setShowSignInPrompt(false)} />
      )}
    </div>
  );
}

function TopicSectionSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-3.5 w-3.5 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-10 animate-pulse rounded-full bg-zinc-100" />
        <div className="ml-auto h-2 w-24 animate-pulse rounded-full bg-zinc-100 sm:w-40" />
      </div>
      <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-3 py-2.5">
            <div className="h-5 w-5 flex-shrink-0 animate-pulse rounded-md bg-zinc-100" />
            <div className="h-4 flex-1 animate-pulse rounded bg-zinc-100" />
          </li>
        ))}
      </ul>
    </div>
  );
}
