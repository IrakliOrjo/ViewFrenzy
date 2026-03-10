# Cache + Service/Data Layer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add in-memory caching to AI context building, and introduce a domain-based service/data layer architecture for all creator data mutations so the cache is invalidated cleanly via a reusable wrapper.

**Architecture:** Each domain lives in its own folder under `src/lib/domains/`. Each domain folder contains a `.data.ts` file (pure Prisma CRUD) and a `.service.ts` file (orchestration + cache invalidation via `withCacheInvalidation` wrapper). Shared utilities live in `src/lib/domains/shared/`. The cache lives in `ai-context.ts` as a `Map<userId, { data, fetchedAt }>` with a 5-minute TTL safety net. API routes remain thin (auth + call service + respond).

**Tech Stack:** TypeScript, Prisma ORM, Next.js App Router API routes

---

## File Map

```
src/lib/
├── ai-context.ts                          ← MODIFY: add cache + invalidateCreatorCache export
│
├── domains/
│   ├── shared/
│   │   └── with-cache-invalidation.ts     ← CREATE: generic wrapper
│   │
│   ├── channel/
│   │   ├── channel.data.ts                ← CREATE: pure Prisma CRUD for Channel, Snapshot, Video
│   │   └── channel.service.ts             ← CREATE: YouTube sync orchestration + cache invalidation
│   │
│   ├── goal/
│   │   ├── goal.data.ts                   ← CREATE: pure Prisma CRUD for Goal
│   │   └── goal.service.ts                ← CREATE: goal mutations + cache invalidation
│   │
│   ├── idea/
│   │   ├── idea.data.ts                   ← CREATE: pure Prisma CRUD for Idea
│   │   └── idea.service.ts                ← CREATE: idea mutations + cache invalidation
│   │
│   └── profile/
│       ├── profile.data.ts                ← CREATE: pure Prisma CRUD for CreatorProfile
│       └── profile.service.ts             ← CREATE: profile mutations + cache invalidation

src/app/api/youtube/sync/route.ts          ← MODIFY: thin controller calling channel.service
```

---

## Task 1: Add Cache to `ai-context.ts`

**Files:**
- Modify: `src/lib/ai-context.ts`

- [ ] **Step 1: Add cache Map, TTL constant, and `invalidateCreatorCache` export**

Add between the `ICreatorData` interface and the `fetchCreatorData` function:

```ts
// --- Cache ---

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const creatorDataCache = new Map<
  string,
  { data: ICreatorData; fetchedAt: number }
>();

export function invalidateCreatorCache(userId: string): void {
  creatorDataCache.delete(userId);
}
```

- [ ] **Step 2: Update `fetchCreatorData` to check cache before querying**

Replace the current `fetchCreatorData` function with:

```ts
async function fetchCreatorData(userId: string): Promise<ICreatorData> {
  const cached = creatorDataCache.get(userId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const [channel, goals, ideas, creatorProfile] = await Promise.all([
    prisma.channel.findUnique({
      where: { userId },
      include: {
        videos: {
          orderBy: { publishedAt: "desc" },
          take: 10,
        },
        snapshots: {
          orderBy: { date: "desc" },
          take: 7,
        },
      },
    }),
    prisma.goal.findMany({
      where: { userId, completed: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.idea.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.creatorProfile.findUnique({
      where: { userId },
    }),
  ]);

  const data: ICreatorData = { channel, goals, ideas, creatorProfile };
  creatorDataCache.set(userId, { data, fetchedAt: Date.now() });
  return data;
}
```

- [ ] **Step 3: Verify the dev server starts without errors**

Run: `npm run dev`
Expected: Compiles without TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai-context.ts
git commit -m "feat: add in-memory cache with TTL to AI context builder"
```

---

## Task 2: Create Shared `withCacheInvalidation` Wrapper

**Files:**
- Create: `src/lib/domains/shared/with-cache-invalidation.ts`

- [ ] **Step 1: Create the wrapper function**

```ts
import { invalidateCreatorCache } from "@/lib/ai-context";

export async function withCacheInvalidation<T>(
  userId: string,
  mutation: () => Promise<T>
): Promise<T> {
  const result = await mutation();
  invalidateCreatorCache(userId);
  return result;
}
```

- [ ] **Step 2: Verify the dev server starts without errors**

Run: `npm run dev`
Expected: Compiles without TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/domains/shared/with-cache-invalidation.ts
git commit -m "feat: add withCacheInvalidation wrapper for domain services"
```

---

## Task 3: Create Channel Domain + Refactor YouTube Sync

This task refactors the existing YouTube sync route — the only existing mutation endpoint that affects AI context.

**Files:**
- Create: `src/lib/domains/channel/channel.data.ts`
- Create: `src/lib/domains/channel/channel.service.ts`
- Modify: `src/app/api/youtube/sync/route.ts`

- [ ] **Step 1: Create `channel.data.ts` with pure Prisma operations**

```ts
import { prisma } from "@/lib/prisma";

export interface IChannelInfo {
  youtubeId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number;
  videoCount: number;
  viewCount: bigint;
}

export interface IVideoData {
  youtubeId: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  publishedAt: Date;
  duration?: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface IVideoAnalytics {
  videoId: string;
  impressions: number;
  ctr: number;
  avgViewDuration: number;
  avgViewPercentage: number;
  estimatedMinutesWatched: number;
}

export async function upsertChannel(userId: string, info: IChannelInfo) {
  return prisma.channel.upsert({
    where: { userId },
    update: {
      title: info.title,
      description: info.description,
      thumbnailUrl: info.thumbnailUrl,
      subscriberCount: info.subscriberCount,
      videoCount: info.videoCount,
      viewCount: info.viewCount,
    },
    create: {
      userId,
      youtubeId: info.youtubeId,
      title: info.title,
      description: info.description,
      thumbnailUrl: info.thumbnailUrl,
      subscriberCount: info.subscriberCount,
      videoCount: info.videoCount,
      viewCount: info.viewCount,
    },
  });
}

export async function createSnapshot(
  channelId: string,
  data: { subscriberCount: number; videoCount: number; viewCount: bigint }
) {
  return prisma.channelSnapshot.create({ data: { channelId, ...data } });
}

export async function upsertVideo(channelId: string, video: IVideoData) {
  return prisma.video.upsert({
    where: { youtubeId: video.youtubeId },
    update: {
      title: video.title,
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      commentCount: video.commentCount,
    },
    create: { channelId, ...video },
  });
}

export async function updateVideoAnalytics(analytics: IVideoAnalytics) {
  return prisma.video.updateMany({
    where: { youtubeId: analytics.videoId },
    data: {
      impressions: analytics.impressions,
      ctr: analytics.ctr,
      avgViewDuration: analytics.avgViewDuration,
      avgViewPercentage: analytics.avgViewPercentage,
      estimatedMinutesWatched: analytics.estimatedMinutesWatched,
    },
  });
}
```

- [ ] **Step 2: Create `channel.service.ts` that orchestrates sync + cache invalidation**

```ts
import {
  getAccessToken,
  fetchChannelInfo,
  fetchRecentVideos,
  fetchVideoAnalytics,
} from "@/lib/youtube";
import { todayISO, daysAgoISO } from "@/helpers/date";
import {
  upsertChannel,
  createSnapshot,
  upsertVideo,
  updateVideoAnalytics,
} from "@/lib/domains/channel/channel.data";
import { withCacheInvalidation } from "@/lib/domains/shared/with-cache-invalidation";

export async function syncYouTubeData(userId: string) {
  const accessToken = await getAccessToken(userId);
  if (!accessToken) {
    return { error: "No YouTube access" as const };
  }

  const channelInfo = await fetchChannelInfo(accessToken);
  if (!channelInfo) {
    return { error: "No channel found" as const };
  }

  const result = await withCacheInvalidation(userId, async () => {
    const channel = await upsertChannel(userId, channelInfo);

    await createSnapshot(channel.id, {
      subscriberCount: channelInfo.subscriberCount,
      videoCount: channelInfo.videoCount,
      viewCount: channelInfo.viewCount,
    });

    const videos = await fetchRecentVideos(accessToken, channelInfo.youtubeId);
    for (const video of videos) {
      await upsertVideo(channel.id, video);
    }

    const endDate = todayISO();
    const startDate = daysAgoISO(28);
    const videoAnalytics = await fetchVideoAnalytics(
      accessToken,
      channelInfo.youtubeId,
      startDate,
      endDate
    );

    for (const analytics of videoAnalytics) {
      await updateVideoAnalytics(analytics);
    }

    return { channel, videoCount: videos.length };
  });

  return result;
}
```

- [ ] **Step 3: Simplify the YouTube sync API route to a thin controller**

Replace the contents of `src/app/api/youtube/sync/route.ts` with:

```ts
import { auth } from "@/lib/auth";
import { syncYouTubeData } from "@/lib/domains/channel/channel.service";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncYouTubeData(session.user.id);

    if ("error" in result) {
      const status = result.error === "No YouTube access" ? 403 : 404;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      success: true,
      channel: {
        ...result.channel,
        viewCount: Number(result.channel.viewCount),
      },
      videoCount: result.videoCount,
    });
  } catch (error) {
    console.error("YouTube sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync YouTube data" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Verify the dev server starts without errors**

Run: `npm run dev`
Expected: Compiles without TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/domains/channel/ src/app/api/youtube/sync/route.ts
git commit -m "refactor: extract YouTube sync into channel domain (data + service layers)"
```

---

## Task 4: Create Goal Domain

**Files:**
- Create: `src/lib/domains/goal/goal.data.ts`
- Create: `src/lib/domains/goal/goal.service.ts`

- [ ] **Step 1: Create `goal.data.ts` with pure Prisma CRUD**

```ts
import { prisma } from "@/lib/prisma";

export interface ICreateGoalInput {
  title: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  deadline?: Date;
}

export interface IUpdateGoalInput {
  title?: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  deadline?: Date;
  completed?: boolean;
}

export async function createGoal(userId: string, data: ICreateGoalInput) {
  return prisma.goal.create({ data: { userId, ...data } });
}

export async function updateGoal(goalId: string, data: IUpdateGoalInput) {
  return prisma.goal.update({ where: { id: goalId }, data });
}

export async function deleteGoal(goalId: string) {
  return prisma.goal.delete({ where: { id: goalId } });
}

export async function getGoalsByUser(userId: string) {
  return prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGoalById(goalId: string) {
  return prisma.goal.findUnique({ where: { id: goalId } });
}
```

- [ ] **Step 2: Create `goal.service.ts` using the wrapper**

```ts
import {
  createGoal,
  updateGoal,
  deleteGoal,
  getGoalsByUser,
  getGoalById,
} from "@/lib/domains/goal/goal.data";
import type { ICreateGoalInput, IUpdateGoalInput } from "@/lib/domains/goal/goal.data";
import { withCacheInvalidation } from "@/lib/domains/shared/with-cache-invalidation";

export async function createGoalForUser(userId: string, data: ICreateGoalInput) {
  return withCacheInvalidation(userId, () => createGoal(userId, data));
}

export async function updateGoalForUser(userId: string, goalId: string, data: IUpdateGoalInput) {
  return withCacheInvalidation(userId, () => updateGoal(goalId, data));
}

export async function deleteGoalForUser(userId: string, goalId: string) {
  return withCacheInvalidation(userId, () => deleteGoal(goalId));
}

export { getGoalsByUser, getGoalById };
```

- [ ] **Step 3: Verify the dev server starts without errors**

Run: `npm run dev`
Expected: Compiles without TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/domains/goal/
git commit -m "feat: add goal domain (data + service layers with cache invalidation)"
```

---

## Task 5: Create Idea Domain

**Files:**
- Create: `src/lib/domains/idea/idea.data.ts`
- Create: `src/lib/domains/idea/idea.service.ts`

- [ ] **Step 1: Create `idea.data.ts` with pure Prisma CRUD**

```ts
import { prisma } from "@/lib/prisma";

export interface ICreateIdeaInput {
  title: string;
  description?: string;
  status?: string;
  format?: string;
  priority?: string;
  notes?: string;
  scheduledDate?: Date;
  linkedVideoId?: string;
}

export interface IUpdateIdeaInput {
  title?: string;
  description?: string;
  status?: string;
  format?: string;
  priority?: string;
  notes?: string;
  scheduledDate?: Date;
  publishDate?: Date;
  linkedVideoId?: string;
}

export async function createIdea(userId: string, data: ICreateIdeaInput) {
  return prisma.idea.create({ data: { userId, ...data } });
}

export async function updateIdea(ideaId: string, data: IUpdateIdeaInput) {
  return prisma.idea.update({ where: { id: ideaId }, data });
}

export async function deleteIdea(ideaId: string) {
  return prisma.idea.delete({ where: { id: ideaId } });
}

export async function getIdeasByUser(userId: string) {
  return prisma.idea.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getIdeaById(ideaId: string) {
  return prisma.idea.findUnique({ where: { id: ideaId } });
}
```

- [ ] **Step 2: Create `idea.service.ts` using the wrapper**

```ts
import {
  createIdea,
  updateIdea,
  deleteIdea,
  getIdeasByUser,
  getIdeaById,
} from "@/lib/domains/idea/idea.data";
import type { ICreateIdeaInput, IUpdateIdeaInput } from "@/lib/domains/idea/idea.data";
import { withCacheInvalidation } from "@/lib/domains/shared/with-cache-invalidation";

export async function createIdeaForUser(userId: string, data: ICreateIdeaInput) {
  return withCacheInvalidation(userId, () => createIdea(userId, data));
}

export async function updateIdeaForUser(userId: string, ideaId: string, data: IUpdateIdeaInput) {
  return withCacheInvalidation(userId, () => updateIdea(ideaId, data));
}

export async function deleteIdeaForUser(userId: string, ideaId: string) {
  return withCacheInvalidation(userId, () => deleteIdea(ideaId));
}

export { getIdeasByUser, getIdeaById };
```

- [ ] **Step 3: Verify the dev server starts without errors**

Run: `npm run dev`
Expected: Compiles without TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/domains/idea/
git commit -m "feat: add idea domain (data + service layers with cache invalidation)"
```

---

## Task 6: Create Profile Domain

**Files:**
- Create: `src/lib/domains/profile/profile.data.ts`
- Create: `src/lib/domains/profile/profile.service.ts`

- [ ] **Step 1: Create `profile.data.ts` with pure Prisma CRUD**

```ts
import { prisma } from "@/lib/prisma";

export interface IUpdateProfileInput {
  niche?: string;
  contentStyle?: string;
  postingFrequency?: string;
  onboardingAnswers?: Record<string, unknown>;
  onboardingNotes?: string;
}

export async function upsertProfile(userId: string, data: IUpdateProfileInput) {
  return prisma.creatorProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

export async function getProfile(userId: string) {
  return prisma.creatorProfile.findUnique({ where: { userId } });
}
```

- [ ] **Step 2: Create `profile.service.ts` using the wrapper**

```ts
import { upsertProfile, getProfile } from "@/lib/domains/profile/profile.data";
import type { IUpdateProfileInput } from "@/lib/domains/profile/profile.data";
import { withCacheInvalidation } from "@/lib/domains/shared/with-cache-invalidation";

export async function updateProfileForUser(userId: string, data: IUpdateProfileInput) {
  return withCacheInvalidation(userId, () => upsertProfile(userId, data));
}

export { getProfile };
```

- [ ] **Step 3: Verify the dev server starts without errors**

Run: `npm run dev`
Expected: Compiles without TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/domains/profile/
git commit -m "feat: add profile domain (data + service layers with cache invalidation)"
```

---

## Summary

After all tasks are complete, the architecture looks like:

```
API Route (thin)
  → auth check
  → call domain service function
  → return response

Domain Service (orchestration)
  → withCacheInvalidation(userId, () => {
      → call domain data function(s)
    })

Domain Data (pure Prisma)
  → prisma.model.create/update/delete/find
```

Adding a new domain (e.g., action plans) requires:
1. Create folder `src/lib/domains/action-plan/`
2. Create `action-plan.data.ts` — pure CRUD, export interfaces
3. Create `action-plan.service.ts` — wrap mutations with `withCacheInvalidation`
4. Create thin API route calling the service

The `withCacheInvalidation` wrapper ensures cache invalidation is never forgotten — it's baked into the domain service pattern. Types are defined once in `.data.ts` and imported by `.service.ts` — no duplication.
