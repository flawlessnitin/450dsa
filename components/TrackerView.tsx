"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { problems, topics, topicCounts, totalCount } from "@/lib/catalog";
import type { ProgressRow, StatusFilter } from "@/lib/types";
import FilterBar from "./FilterBar";
import TopicSection from "./TopicSection";
import ProgressBar from "./ProgressBar";
import UserMenu from "./UserMenu";
import SignInPrompt from "./SignInPrompt";

type Entry = { done: boolean; starred: boolean; note: string };
type ProgressMap = Record<number, Entry>;

const EMPTY: Entry = { done: false, starred: false, note: "" };
const COLLAPSE_KEY = "f450:collapsed";

function buildMap(rows: ProgressRow[]): ProgressMap {
  const map: ProgressMap = {};
  for (const r of rows) {
    map[r.problem_id] = { done: r.done, starred: r.starred, note: r.note ?? "" };
  }
  return map;
}

export default function TrackerView({
  userId,
  userEmail,
  userName,
  avatarUrl,
  initialProgress,
}: {
  userId: string | null;
  userEmail: string;
  userName?: string | null;
  avatarUrl?: string | null;
  initialProgress: ProgressRow[];
}) {
  const isGuest = userId === null;

  const supabase = useMemo(() => createClient(), []);

  const [progress, setProgress] = useState<ProgressMap>(() =>
    buildMap(initialProgress),
  );
  const progressRef = useRef(progress);

  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const noteTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Restore collapsed topics from a previous visit. This runs once on mount —
  // we can't read localStorage in the useState initializer without breaking SSR
  // hydration, so a one-time sync from this external store is the correct place.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (raw) {
        const list: string[] = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCollapsed(Object.fromEntries(list.map((t) => [t, true])));
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    const list = Object.keys(collapsed).filter((t) => collapsed[t]);
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(list));
  }, [collapsed]);

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
      if (isGuest) {
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
    [isGuest, apply, writeRow],
  );

  const onToggleStar = useCallback(
    (id: number) => {
      if (isGuest) {
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
    [isGuest, apply, writeRow],
  );

  const onNoteChange = useCallback(
    (id: number, note: string) => {
      if (isGuest) {
        setShowSignInPrompt(true);
        return;
      }
      apply(id, { note });
      clearTimeout(noteTimers.current[id]);
      noteTimers.current[id] = setTimeout(() => {
        writeRow(id, progressRef.current[id] ?? { ...EMPTY, note });
      }, 600);
    },
    [isGuest, apply, writeRow],
  );

  const onToggleCollapse = useCallback((topic: string) => {
    setCollapsed((prev) => ({ ...prev, [topic]: !prev[topic] }));
  }, []);

  const expandAll = useCallback(() => setCollapsed({}), []);
  const collapseAll = useCallback(
    () => setCollapsed(Object.fromEntries(topics.map((t) => [t, true]))),
    [],
  );

  // Overall + per-topic done counts (reflect true progress, ignoring filters).
  const overallDone = useMemo(
    () => Object.values(progress).filter((e) => e.done).length,
    [progress],
  );
  const starredCount = useMemo(
    () => Object.values(progress).filter((e) => e.starred).length,
    [progress],
  );
  const doneByTopic = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of problems) {
      if (progress[p.id]?.done) map[p.topic] = (map[p.topic] ?? 0) + 1;
    }
    return map;
  }, [progress]);

  // Filtered + grouped view for rendering.
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return topics
      .filter((t) => topicFilter === "all" || t === topicFilter)
      .map((t) => ({
        topic: t,
        items: problems
          .filter((p) => p.topic === t)
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
          }),
      }))
      .filter((g) => g.items.length > 0);
  }, [progress, search, topicFilter, status]);

  const overallPct = Math.round((overallDone / totalCount) * 100);

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="text-base font-semibold tracking-tight text-zinc-900">
            Final <span className="text-indigo-600">450</span>
          </span>
          <UserMenu
            isGuest={isGuest}
            userName={userName}
            userEmail={userEmail}
            avatarUrl={avatarUrl}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-sm text-zinc-500">Overall progress</p>
              <p className="mt-0.5 text-2xl font-semibold text-zinc-900">
                {overallDone}
                <span className="text-zinc-400"> / {totalCount}</span>
                <span className="ml-2 text-base font-medium text-emerald-600">
                  {overallPct}%
                </span>
              </p>
            </div>
            <p className="text-sm text-zinc-500">
              <span className="font-medium text-amber-500">★ {starredCount}</span>{" "}
              starred
            </p>
          </div>
          <ProgressBar value={overallDone} total={totalCount} />
        </div>

        {saveError && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {saveError}
          </p>
        )}

        <div className="mb-5">
          <FilterBar
            search={search}
            onSearch={setSearch}
            topic={topicFilter}
            onTopic={setTopicFilter}
            topics={topics}
            status={status}
            onStatus={setStatus}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
          />
        </div>

        <div className="space-y-3">
          {groups.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 bg-white py-12 text-center text-sm text-zinc-500">
              No problems match your filters.
            </p>
          ) : (
            groups.map((g) => (
              <TopicSection
                key={g.topic}
                topic={g.topic}
                items={g.items}
                doneCount={doneByTopic[g.topic] ?? 0}
                total={topicCounts[g.topic]}
                collapsed={!!collapsed[g.topic]}
                onToggleCollapse={onToggleCollapse}
                onToggleDone={onToggleDone}
                onToggleStar={onToggleStar}
                onNoteChange={onNoteChange}
              />
            ))
          )}
        </div>
      </main>

      {showSignInPrompt && (
        <SignInPrompt onClose={() => setShowSignInPrompt(false)} />
      )}
    </div>
  );
}
