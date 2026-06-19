import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { problemById, problems, problemSlug, topicSlug } from "@/lib/catalog";
import { breadcrumbJsonLd } from "@/lib/seo";
import { baseUrl } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";

type Params = { params: Promise<{ slug: string }> };

function parseLeadingId(slug: string): number | null {
  const match = /^(\d+)-/.exec(slug);
  return match ? Number(match[1]) : null;
}

function getProblemBySlug(slug: string) {
  const id = parseLeadingId(slug);
  if (id === null) return null;
  return problemById(id) ?? null;
}

export function generateStaticParams() {
  return problems.map((p) => ({ slug: problemSlug(p) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const problem = getProblemBySlug(slug);
  if (!problem) return { title: "Problem not found" };

  const title = `${problem.title} — ${problem.topic} | Final 450 DSA Sheet`;
  const description = `Solve "${problem.title}", a ${problem.topic} question from the Final 450 DSA sheet. Practice on GeeksforGeeks, LeetCode, or Coding Ninjas and track your progress.`;
  const canonical = `/problems/${problemSlug(problem)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProblemPage({ params }: Params) {
  const { slug } = await params;
  const problem = getProblemBySlug(slug);
  if (!problem) notFound();

  const canonicalSlug = problemSlug(problem);
  if (slug !== canonicalSlug) {
    permanentRedirect(`/problems/${canonicalSlug}`);
  }

  const links = [
    { label: "GeeksforGeeks", value: problem.url },
    { label: "LeetCode", value: problem.leetcodeUrl },
    { label: "Coding Ninjas", value: problem.codingNinjaUrl },
  ].filter((l): l is { label: string; value: string } => Boolean(l.value));

  const topicHref = `/topics/${topicSlug(problem.topic)}`;
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: baseUrl },
    { name: "Topics", url: `${baseUrl}/topics` },
    { name: problem.topic, url: `${baseUrl}${topicHref}` },
    { name: problem.title, url: `${baseUrl}/problems/${canonicalSlug}` },
  ]);

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-4xl">
          <nav className="mb-4 text-xs text-zinc-500">
            <Link href="/topics" className="hover:text-indigo-600">
              Topics
            </Link>
            {" / "}
            <Link href={topicHref} className="hover:text-indigo-600">
              {problem.topic}
            </Link>
          </nav>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
              {problem.topic}
            </p>
            <h1 className="mt-1 text-xl font-semibold text-zinc-900">{problem.title}</h1>

            {links.length > 0 ? (
              <>
                <p className="mt-4 text-sm text-zinc-600">
                  Part of the Final 450 DSA sheet. Solve it on one of the links below, then{" "}
                  <Link href="/login" className="text-indigo-600 hover:underline">
                    sign up to track your progress
                  </Link>
                  .
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {links.map((l) => (
                    <a
                      key={l.label}
                      href={l.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:border-indigo-300 hover:text-indigo-600"
                    >
                      {l.label} ↗
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-zinc-600">
                This is a conceptual question with no single practice link — see the{" "}
                <Link href={topicHref} className="text-indigo-600 hover:underline">
                  {problem.topic} topic page
                </Link>{" "}
                for related practice problems.
              </p>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-zinc-400">
            <Link href="/" className="hover:text-zinc-600">
              Final 450 — DSA Tracker
            </Link>
          </p>
        </div>
        <JsonLd data={breadcrumb} />
      </main>
    </>
  );
}
