// Avatar: shows the uploaded photo if present, otherwise a zero-cost generated
// initials avatar with a deterministic color. Used in the header, profile, and
// public pages.

const COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-orange-500",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({
  name,
  email,
  src,
  size = 40,
  className = "",
}: {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const label = (name || email || "?").trim();
  const dimension = { width: size, height: size };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote Supabase avatar URL; a plain img avoids next/image remotePatterns config
      <img
        src={src}
        alt={label}
        style={dimension}
        className={`flex items-center justify-center rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={{ ...dimension, fontSize: size * 0.4 }}
      className={`flex items-center justify-center rounded-full font-semibold text-white ${colorFor(
        label,
      )} ${className}`}
      aria-label={label}
    >
      {initials(name || email || "?")}
    </div>
  );
}
