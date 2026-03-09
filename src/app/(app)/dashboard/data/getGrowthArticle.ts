import { unstable_cache } from "next/cache";
import Parser from "rss-parser";
import { RSS_FEEDS } from "@/constants/rssFeeds";
import type { IGrowthArticle } from "@/types/dashboard";

const parser = new Parser();

async function fetchLatestArticle(): Promise<IGrowthArticle | null> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return { feed, items: parsed.items };
    })
  );

  const articles: IGrowthArticle[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { feed, items } = result.value;

    for (const item of items) {
      if (!item.title || !item.link) continue;

      // Try to extract an image from common RSS fields
      const imageUrl =
        item.enclosure?.url ??
        item["media:content"]?.$.url ??
        item["media:thumbnail"]?.$.url ??
        extractImageFromContent(
          item["content:encoded"] ?? item.content ?? ""
        ) ??
        null;

      articles.push({
        title: item.title,
        url: item.link,
        source: feed.name,
        description: item.contentSnippet ?? item.summary ?? null,
        imageUrl,
        publishedAt: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date(0).toISOString(),
      });
    }
  }

  if (articles.length === 0) return null;

  // Sort by date descending and return the most recent
  articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return articles[0];
}

/**
 * Extract the first <img src="..."> from HTML content.
 */
function extractImageFromContent(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

export const getGrowthArticle = unstable_cache(
  fetchLatestArticle,
  ["growth-article"],
  { revalidate: 21600 } // 6 hours in seconds
);
