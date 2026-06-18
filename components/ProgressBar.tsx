// A thin, presentational progress bar. Caller renders any labels.
export default function ProgressBar({
  value,
  total,
  className = "",
  barClassName = "bg-emerald-500",
}: {
  value: number;
  total: number;
  className?: string;
  barClassName?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-zinc-200 ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={total}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${barClassName}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
