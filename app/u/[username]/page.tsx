import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { totalCount } from "@/lib/catalog";
import type { Profile } from "@/lib/types";
import Avatar from "@/components/Avatar";
import SiteHeader from "@/components/SiteHeader";

type Params = { params: Promise<{ username: string }> };

async function getProfile(usernameRaw: string): Promise<Profile | null> {
  const username = decodeURIComponent(usernameRaw).toLowerCase();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .eq("is_public", true)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: "Profile not found" };
  const name = profile.full_name || username;
  const description = profile.headline ?? `Check out ${name}'s DSA progress on the Final 450 tracker.`;
  const title = `${name} — Final 450`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/u/${username}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicProfile({ params }: Params) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const supabase = await createClient();
  const { data: solved } = await supabase.rpc("public_solved_count", {
    uname: profile.username,
  });
  const solvedCount = typeof solved === "number" ? solved : 0;
  const pct = Math.round((solvedCount / totalCount) * 100);

  const work = [profile.job_title, profile.company].filter(Boolean).join(" · ");
  const links = [
    { label: "Website", value: profile.website },
    { label: "LinkedIn", value: profile.linkedin },
    { label: "X", value: profile.twitter },
    { label: "GitHub", value: profile.github },
    { label: "LeetCode", value: profile.leetcode },
    { label: "Codeforces", value: profile.codeforces },
  ].filter((l): l is { label: string; value: string } => Boolean(l.value));

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Avatar
                name={profile.full_name}
                email={profile.username}
                src={profile.avatar_url}
                size={72}
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold text-zinc-900">
                  {profile.full_name || `@${profile.username}`}
                </h1>
                {profile.headline && (
                  <p className="text-sm text-zinc-500">{profile.headline}</p>
                )}
                {profile.location && (
                  <p className="mt-0.5 text-xs text-zinc-400">📍 {profile.location}</p>
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="mt-4 whitespace-pre-line text-sm text-zinc-700">
                {profile.bio}
              </p>
            )}

            {(work || profile.education) && (
              <dl className="mt-4 space-y-1.5 text-sm">
                {work && (
                  <div className="flex gap-2">
                    <dt className="w-20 flex-shrink-0 text-zinc-400">Work</dt>
                    <dd className="text-zinc-700">{work}</dd>
                  </div>
                )}
                {profile.education && (
                  <div className="flex gap-2">
                    <dt className="w-20 flex-shrink-0 text-zinc-400">Education</dt>
                    <dd className="text-zinc-700">{profile.education}</dd>
                  </div>
                )}
              </dl>
            )}

            {/* DSA progress badge */}
            <div className="mt-5 rounded-xl bg-zinc-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Final 450 progress</span>
                <span className="font-semibold text-zinc-800">
                  {solvedCount}
                  <span className="text-zinc-400"> / {totalCount}</span>
                  <span className="ml-2 text-emerald-600">{pct}%</span>
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {links.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {links.map((l) => (
                  <a
                    key={l.label}
                    href={normalizeUrl(l.value)}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:border-indigo-300 hover:text-indigo-600"
                  >
                    {l.label} ↗
                  </a>
                ))}
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-zinc-400">
            <Link href="/" className="hover:text-zinc-600">
              Final 450 — DSA Tracker
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

function normalizeUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
