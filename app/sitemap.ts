import { MetadataRoute } from "next";
import { problems, topics, problemSlug, topicSlug } from "@/lib/catalog";
import { baseUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const root: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/topics`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const topicEntries: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: `${baseUrl}/topics/${topicSlug(topic)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const problemEntries: MetadataRoute.Sitemap = problems.map((problem) => ({
    url: `${baseUrl}/problems/${problemSlug(problem)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...root, ...topicEntries, ...problemEntries];
}
