import Link from "next/link";
import type { Metadata } from "next";
import { topics, topicSlug, topicCounts, totalCount } from "@/lib/catalog";
import { breadcrumbJsonLd } from "@/lib/seo";
import { baseUrl } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";

const title = "Browse the Final 450 DSA Sheet by Topic";
const description = `All ${totalCount} questions from the Final 450 DSA sheet, organized into ${topics.length} topics — Array, Graph, Dynamic Programming, and more.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/topics" },
  openGraph: { title, description, url: "/topics", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function TopicsIndexPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: baseUrl },
    { name: "Topics", url: `${baseUrl}/topics` },
  ]);

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Final 450 DSA Sheet — Browse by Topic
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {totalCount} questions across {topics.length} topics. Pick a topic to see its
            questions and links to GeeksforGeeks, LeetCode, and Coding Ninjas.
          </p>

          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {topics.map((topic) => (
              <li key={topic}>
                <Link
                  href={`/topics/${topicSlug(topic)}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-300"
                >
                  <span className="font-medium text-zinc-900">{topic}</span>
                  <span className="ml-2 text-sm text-zinc-400">
                    {topicCounts[topic]} questions
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <JsonLd data={breadcrumb} />
      </main>
    </>
  );
}
