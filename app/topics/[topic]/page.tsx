import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  topics,
  topicBySlug,
  topicSlug,
  problemSlug,
  problemsByTopic,
  topicCounts,
} from "@/lib/catalog";
import { topicContent } from "@/data/topicContent";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { baseUrl } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

type Params = { params: Promise<{ topic: string }> };

export function generateStaticParams() {
  return topics.map((topic) => ({ topic: topicSlug(topic) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = topicBySlug[slug];
  if (!topic) return { title: "Topic not found" };

  const title = `${topic} DSA Questions — Final 450 Sheet`;
  const description = `${topicCounts[topic]} ${topic} questions from the Final 450 DSA sheet, with links to GeeksforGeeks, LeetCode, and Coding Ninjas.`;
  const canonical = `/topics/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TopicPage({ params }: Params) {
  const { topic: slug } = await params;
  const topic = topicBySlug[slug];
  if (!topic) notFound();

  const topicProblems = problemsByTopic(topic);
  const intro = topicContent[topic] ?? `${topic} questions from the Final 450 DSA sheet.`;

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: baseUrl },
    { name: "Topics", url: `${baseUrl}/topics` },
    { name: topic, url: `${baseUrl}/topics/${slug}` },
  ]);
  const itemList = itemListJsonLd(
    topicProblems.map((p) => ({
      name: p.title,
      url: `${baseUrl}/problems/${problemSlug(p)}`,
    })),
  );

  return (
    <main className="flex flex-1 items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <nav className="mb-4 text-xs text-zinc-500">
          <Link href="/topics" className="hover:text-indigo-600">
            Topics
          </Link>
        </nav>

        <h1 className="text-2xl font-semibold text-zinc-900">{topic}</h1>
        <p className="mt-2 text-sm text-zinc-600">{intro}</p>

        <ul className="mt-6 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
          {topicProblems.map((p) => (
            <li key={p.id}>
              <Link
                href={`/problems/${problemSlug(p)}`}
                className="block px-4 py-3 text-sm text-zinc-700 transition hover:bg-zinc-50 hover:text-indigo-600"
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <JsonLd data={breadcrumb} />
      <JsonLd data={itemList} />
    </main>
  );
}
