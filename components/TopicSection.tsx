"use client";

import Link from "next/link";
import type { ProblemState } from "@/lib/types";
import { topicSlug } from "@/lib/catalog";
import ProblemRow from "./ProblemRow";
import ProgressBar from "./ProgressBar";

export default function TopicSection({
  topic,
  items,
  doneCount,
  total,
  collapsed,
  onToggleCollapse,
  onToggleDone,
  onToggleStar,
  onNoteChange,
  linkToTopicPage = true,
}: {
  topic: string;
  items: ProblemState[];
  doneCount: number;
  total: number;
  collapsed: boolean;
  onToggleCollapse: (topic: string) => void;
  onToggleDone: (id: number) => void;
  onToggleStar: (id: number) => void;
  onNoteChange: (id: number, note: string) => void;
  /** False when this section is already embedded on that topic's own page — linking to itself is pointless. */
  linkToTopicPage?: boolean;
}) {
  const complete = doneCount === total;

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        aria-label={`Toggle ${topic} section`}
        onClick={() => onToggleCollapse(topic)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleCollapse(topic);
          }
        }}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50"
      >
        <Chevron open={!collapsed} />
        <h2 className="text-sm font-semibold text-zinc-800">
          {linkToTopicPage ? (
            <Link
              href={`/topics/${topicSlug(topic)}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:text-indigo-600 hover:underline"
            >
              {topic}
            </Link>
          ) : (
            topic
          )}
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            complete
              ? "bg-emerald-100 text-emerald-700"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {doneCount}/{total}
        </span>
        <div className="ml-auto w-24 sm:w-40">
          <ProgressBar value={doneCount} total={total} />
        </div>
      </div>

      {!collapsed && (
        <ul>
          {items.map((p) => (
            <ProblemRow
              key={p.id}
              problem={p}
              done={p.done}
              starred={p.starred}
              note={p.note}
              onToggleDone={onToggleDone}
              onToggleStar={onToggleStar}
              onNoteChange={onNoteChange}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={`flex-shrink-0 text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`}
      aria-hidden="true"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
