# Growth Article Card Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dashboard card that shows the latest YouTube growth article from curated RSS feeds, with thumbnail, title, and source name.

**Architecture:** A constants file holds RSS feed URLs. A data-fetching function parses feeds server-side with `rss-parser`, caches for 6 hours via `unstable_cache`, and returns the most recent article. A server component renders the card. Thumbnails use `<img>` with unoptimized loading since article image domains are unpredictable.

**Tech Stack:** `rss-parser` (RSS parsing), Next.js `unstable_cache` (caching), Tailwind CSS (styling)

---

### Task 1: Install `rss-parser`

**Step 1: Install the package**

Run: `npm install rss-parser`

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add rss-parser dependency"
```

---

### Task 2: Create RSS Feed Constants

**Files:**
- Create: `src/constants/rssFeeds.ts`

**Step 1: Create the constants file**

```ts
// src/constants/rssFeeds.ts
export const RSS_FEEDS = [
  {
    name: "vidIQ",
    url: "https://www.vidiq.com/blog/rss.xml",
  },
  {
    name: "Think Media",
    url: "https://www.thinkmediapodcast.com/feed",
  },
  {
    name: "Backlinko",
    url: "https://backlinko.com/feed",
  },
];
```

Note: These URLs may need adjustment at runtime if a feed doesn't resolve. The data fetcher handles fetch failures gracefully per-feed.

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/constants/rssFeeds.ts
git commit -m "feat: add RSS feed source constants"
```

---

### Task 3: Create Article Type

**Files:**
- Modify: `src/types/dashboard.ts`

**Step 1: Add the `IGrowthArticle` interface**

Add to the bottom of `src/types/dashboard.ts`:

```ts
export interface IGrowthArticle {
  title: string;
  url: string;
  source: string;
  imageUrl: string | null;
  publishedAt: Date;
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/types/dashboard.ts
git commit -m "feat: add IGrowthArticle type"
```

---

### Task 4: Create Data Fetcher

**Files:**
- Create: `src/app/(app)/dashboard/data/getGrowthArticle.ts`

**Step 1: Create the data-fetching function**

This function fetches all RSS feeds in parallel, parses them, and returns the most recent article. It uses `unstable_cache` for 6-hour caching so we don't hit feeds on every page load.

```ts
// src/app/(app)/dashboard/data/getGrowthArticle.ts
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
        extractImageFromContent(item["content:encoded"] ?? item.content ?? "") ??
        null;

      articles.push({
        title: item.title,
        url: item.link,
        source: feed.name,
        imageUrl,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(0),
      });
    }
  }

  if (articles.length === 0) return null;

  // Sort by date descending and return the most recent
  articles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
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
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

If there are type errors around `rss-parser` media fields, add a type declaration. Create `src/types/rss-parser.d.ts`:

```ts
// src/types/rss-parser.d.ts
import "rss-parser";

declare module "rss-parser" {
  interface Item {
    "media:content"?: { $: { url: string } };
    "media:thumbnail"?: { $: { url: string } };
    "content:encoded"?: string;
  }
}
```

Run `npx tsc --noEmit` again — should pass.

**Step 3: Commit**

```bash
git add src/app/(app)/dashboard/data/getGrowthArticle.ts src/types/rss-parser.d.ts
git commit -m "feat: add RSS data fetcher with 6-hour caching"
```

---

### Task 5: Create GrowthArticle Component

**Files:**
- Create: `src/app/(app)/dashboard/components/GrowthArticle.tsx`

**Step 1: Create the component**

Server component. Uses `<img>` (not `next/image`) for article thumbnails since domains are unpredictable. Falls back to a `Newspaper` icon when no image is available.

```tsx
// src/app/(app)/dashboard/components/GrowthArticle.tsx
import { BookOpen, ExternalLink, Newspaper } from "lucide-react";
import type { IGrowthArticle } from "@/types/dashboard";

interface GrowthArticleProps {
  article: IGrowthArticle | null;
}

export function GrowthArticle({ article }: GrowthArticleProps) {
  return (
    <div className="bg-card p-6 rounded-xl shadow-sm border border-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="size-5 text-primary" />
        <h3 className="font-bold">Growth Reading</h3>
      </div>

      {article ? (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-3 flex items-center justify-center">
            {article.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Newspaper className="size-8 text-muted-foreground" />
            )}
          </div>

          <h4 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h4>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">
              {article.source}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Read article
              <ExternalLink className="size-3" />
            </span>
          </div>
        </a>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <Newspaper className="size-8 mb-2" />
          <p className="text-sm">No articles available</p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/(app)/dashboard/components/GrowthArticle.tsx
git commit -m "feat: add GrowthArticle dashboard component"
```

---

### Task 6: Add to Dashboard Page

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

**Step 1: Import and add to layout**

Add `GrowthArticle` import and `getGrowthArticle` data fetcher. Place it in a 2-column grid with `RecentVideos`.

```tsx
// Add imports at top:
import { GrowthArticle } from "@/app/(app)/dashboard/components/GrowthArticle";
import { getGrowthArticle } from "@/app/(app)/dashboard/data/getGrowthArticle";
```

Inside the component, fetch the article alongside existing data:

```tsx
export default async function DashboardPage() {
  const [dashboardData, article] = await Promise.all([
    getDashboardData(),
    getGrowthArticle(),
  ]);

  const { greeting, displayName, levelInfo, stats, recentVideos } = dashboardData;

  // ... existing JSX ...
```

Replace the current `RecentVideos` section at the bottom with a 2-column grid:

```tsx
      {/* Recent Videos + Growth Article */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentVideos videos={recentVideos} />
        <GrowthArticle article={article} />
      </div>
```

**Step 2: Verify**

Run: `npx tsc --noEmit && npx next build`
Expected: Clean build, no errors

**Step 3: Visual check**

Run: `npm run dev`
Expected: Dashboard shows Recent Videos on the left and Growth Article card on the right, with a real article from one of the RSS feeds.

**Step 4: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx
git commit -m "feat: add growth article card to dashboard layout"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Install `rss-parser` | `package.json` |
| 2 | RSS feed URL constants | `src/constants/rssFeeds.ts` |
| 3 | `IGrowthArticle` type | `src/types/dashboard.ts` |
| 4 | Data fetcher with caching | `src/app/(app)/dashboard/data/getGrowthArticle.ts` |
| 5 | `GrowthArticle` component | `src/app/(app)/dashboard/components/GrowthArticle.tsx` |
| 6 | Wire into dashboard page | `src/app/(app)/dashboard/page.tsx` |
