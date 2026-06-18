"use client";

import { memo, useState } from "react";
import type { Problem } from "@/lib/types";
import NoteEditor from "./NoteEditor";

type Props = {
  problem: Problem;
  done: boolean;
  starred: boolean;
  note: string;
  onToggleDone: (id: number) => void;
  onToggleStar: (id: number) => void;
  onNoteChange: (id: number, note: string) => void;
};

function ProblemRow({
  problem,
  done,
  starred,
  note,
  onToggleDone,
  onToggleStar,
  onNoteChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const hasNote = note.trim().length > 0;

  return (
    <li className="border-t border-zinc-100 px-3 py-2 first:border-t-0 hover:bg-zinc-50/60">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onToggleDone(problem.id)}
          aria-label={done ? "Mark as not done" : "Mark as done"}
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition ${
            done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-zinc-300 bg-white hover:border-emerald-400"
          }`}
        >
          {done && <CheckIcon />}
        </button>

        <div className="min-w-0 flex-1">
          {problem.url ? (
            <a
              href={problem.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group inline-flex items-center gap-1 text-sm transition ${
                done
                  ? "text-zinc-400 line-through"
                  : "text-zinc-700 hover:text-indigo-600"
              }`}
            >
              <span className="truncate">{problem.title}</span>
              <ExternalIcon />
            </a>
          ) : (
            <span
              className={`text-sm ${done ? "text-zinc-400 line-through" : "text-zinc-700"}`}
            >
              {problem.title}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle notes"
          className={`flex-shrink-0 rounded-md p-1 transition hover:bg-zinc-100 ${
            hasNote ? "text-indigo-500" : "text-zinc-400"
          }`}
        >
          <NoteIcon filled={hasNote} />
        </button>

        <button
          type="button"
          onClick={() => onToggleStar(problem.id)}
          aria-label={starred ? "Unstar" : "Star for revision"}
          className={`flex-shrink-0 rounded-md p-1 transition hover:bg-zinc-100 ${
            starred ? "text-amber-500" : "text-zinc-300 hover:text-amber-400"
          }`}
        >
          <StarIcon filled={starred} />
        </button>
      </div>

      {open && (
        <NoteEditor value={note} onChange={(v) => onNoteChange(problem.id, v)} />
      )}
    </li>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.5L5 9L9.5 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      className="flex-shrink-0 opacity-0 transition group-hover:opacity-100"
      aria-hidden="true"
    >
      <path
        d="M7 17L17 7M17 7H8M17 7V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.2l1-5.8L3.5 9.2l5.9-.9L12 3z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NoteIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v9A1.5 1.5 0 0118.5 16H9l-4 4V5.5z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Memoize so toggling one row doesn't re-render the other 447.
export default memo(ProblemRow);
