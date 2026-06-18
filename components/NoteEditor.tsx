"use client";

// Per-problem notes. Changes are reported immediately; the parent debounces
// the actual save, so we just show a gentle autosave hint.
export default function NoteEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-2 pl-9">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Your approach, complexity, gotchas…"
        className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />
      <p className="mt-1 text-[11px] text-zinc-400">Notes save automatically.</p>
    </div>
  );
}
