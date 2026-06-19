"use client";

import type { StatusFilter } from "@/lib/types";

const STATUSES: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "done", label: "Done" },
  { key: "starred", label: "Starred" },
];

export default function FilterBar({
  search,
  onSearch,
  topic,
  onTopic,
  topics,
  status,
  onStatus,
  onExpandAll,
  onCollapseAll,
  showTopicFilter = true,
  showExpandCollapse = true,
}: {
  search: string;
  onSearch: (v: string) => void;
  topic?: string;
  onTopic?: (v: string) => void;
  topics?: string[];
  status: StatusFilter;
  onStatus: (v: StatusFilter) => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  showTopicFilter?: boolean;
  showExpandCollapse?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search problems…"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {showTopicFilter && (
          <select
            value={topic}
            onChange={(e) => onTopic?.(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All topics</option>
            {topics?.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}

        <div className="flex rounded-lg bg-zinc-100 p-1 text-sm">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onStatus(s.key)}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                status === s.key
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {showExpandCollapse && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <button
            type="button"
            onClick={onExpandAll}
            className="rounded-md px-2 py-1 transition hover:bg-zinc-100"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={onCollapseAll}
            className="rounded-md px-2 py-1 transition hover:bg-zinc-100"
          >
            Collapse all
          </button>
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20l-3-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
