# Overview Page & XP Leveling System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Overview page (the authenticated user's home screen) with channel stats, coach's note, milestone progress, action items — plus a persistent XP leveling bar in the header. Stats are real data; coach/milestones/actions use mock data for now.

**Architecture:** Server component page fetches channel + snapshot data from Prisma, passes to client sub-components. XP system adds fields to the database and a persistent level bar in the Header. Helper functions handle XP calculations and stat formatting. All UI components follow the existing design system (Tailwind + shadcn/ui + orange primary).

**Tech Stack:** Next.js 15 (App Router, server components), TypeScript, Prisma ORM, Tailwind CSS, shadcn/ui, Lucide icons

---

## Task 1: Database — Add XP Fields to User Model

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add XP fields to User model**

In `prisma/schema.prisma`, add these fields to the `User` model (after the `updatedAt` field):

```prisma
  // XP & Leveling
  totalXp       Int      @default(0)
  level         Int      @default(1)
```

**Step 2: Push schema changes**

Run:
```bash
npx prisma db push
```

Expected: Schema synced, no errors.

**Step 3: Regenerate Prisma client**

Run:
```bash
npx prisma generate
```

Expected: Client regenerated with new `totalXp` and `level` fields on User.

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add XP and level fields to User model"
```

---

## Task 2: XP System — Constants & Helpers

**Files:**
- Create: `src/constants/xp.ts`
- Create: `src/helpers/calculateLevel.ts`
- Create: `src/helpers/formatNumber.ts`

**Step 1: Create XP constants**

Create `src/constants/xp.ts`:

```typescript
export interface IXpLevel {
  level: number;
  title: string;
  xpRequired: number; // total XP needed to reach this level
}

// Each level requires progressively more XP.
// XP thresholds are cumulative (total XP, not per-level).
export const XP_LEVELS: IXpLevel[] = [
  { level: 1, title: "Spark", xpRequired: 0 },
  { level: 2, title: "Ember", xpRequired: 100 },
  { level: 3, title: "Flame", xpRequired: 300 },
  { level: 4, title: "Blaze", xpRequired: 600 },
  { level: 5, title: "Inferno", xpRequired: 1000 },
  { level: 6, title: "Firestorm", xpRequired: 1500 },
  { level: 7, title: "Supernova", xpRequired: 2200 },
  { level: 8, title: "Legendary", xpRequired: 3000 },
  { level: 9, title: "Mythic", xpRequired: 4000 },
  { level: 10, title: "Transcendent", xpRequired: 5500 },
];

// XP rewards for various actions.
// These are referenced when awarding XP (future tasks).
export const XP_REWARDS = {
  SYNC_CHANNEL: 10,
  COMPLETE_GOAL: 50,
  PUBLISH_VIDEO: 30,
  CHAT_WITH_COACH: 5,
  COMPLETE_ONBOARDING: 100,
  WEEKLY_LOGIN_STREAK: 25,
  HIT_MILESTONE: 75,
} as const;
```

**Step 2: Create level calculation helper**

Create `src/helpers/calculateLevel.ts`:

```typescript
import { XP_LEVELS } from "@/constants/xp";

export interface ILevelInfo {
  level: number;
  title: string;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number;       // XP earned within current level
  xpNeeded: number;         // XP needed to fill current level bar
  progressPercent: number;  // 0-100
  isMaxLevel: boolean;
}

/**
 * Calculate the user's level info from their total XP.
 * Returns all the data needed to render the XP bar.
 */
export function calculateLevel(totalXp: number): ILevelInfo {
  // Find the highest level the user has reached
  let currentLevel = XP_LEVELS[0];
  for (const level of XP_LEVELS) {
    if (totalXp >= level.xpRequired) {
      currentLevel = level;
    } else {
      break;
    }
  }

  const currentIndex = XP_LEVELS.findIndex(
    (l) => l.level === currentLevel.level
  );
  const isMaxLevel = currentIndex === XP_LEVELS.length - 1;
  const nextLevel = isMaxLevel ? null : XP_LEVELS[currentIndex + 1];

  const xpForCurrentLevel = currentLevel.xpRequired;
  const xpForNextLevel = nextLevel?.xpRequired ?? currentLevel.xpRequired;
  const xpProgress = totalXp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = isMaxLevel
    ? 100
    : Math.min(Math.round((xpProgress / xpNeeded) * 100), 100);

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    currentXp: totalXp,
    xpForCurrentLevel,
    xpForNextLevel,
    xpProgress,
    xpNeeded,
    progressPercent,
    isMaxLevel,
  };
}
```

**Step 3: Create number formatting helper**

Create `src/helpers/formatNumber.ts`:

```typescript
/**
 * Format a number for display.
 * - Under 1K: "487"
 * - 1K-999K: "24.3K"
 * - 1M+: "1.2M"
 */
export function formatNumber(num: number | bigint): string {
  const n = typeof num === "bigint" ? Number(num) : num;

  if (n < 1000) return n.toString();
  if (n < 1_000_000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  const m = n / 1_000_000;
  return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
}

/**
 * Format a percentage with sign.
 * E.g. 2.5 → "+2.5%", -3.1 → "-3.1%"
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
```

**Step 4: Commit**

```bash
git add src/constants/xp.ts src/helpers/calculateLevel.ts src/helpers/formatNumber.ts
git commit -m "feat: add XP leveling constants and calculation helpers"
```

---

## Task 3: XP Level Bar — Header Component

**Files:**
- Create: `src/components/Header/components/XpLevelBar.tsx`
- Modify: `src/components/Header/Header.tsx` (add XpLevelBar)
- Modify: `src/components/Header/Header.tsx` (update HeaderProps to accept XP data)
- Modify: `src/components/AppShell/AppShell.tsx` (pass XP data to Header)
- Modify: `src/app/(app)/layout.tsx` (fetch user XP data and pass to AppShell)

The XP bar is a persistent UI element in the header. It shows:
- Level number + title (e.g. "Lv.3 Flame")
- A progress bar showing XP toward next level
- XP numbers on hover/tooltip (e.g. "300/600 XP")

**Step 1: Create XpLevelBar component**

Create `src/components/Header/components/XpLevelBar.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ILevelInfo } from "@/helpers/calculateLevel";

interface XpLevelBarProps {
  levelInfo: ILevelInfo;
}

export function XpLevelBar({ levelInfo }: XpLevelBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Level badge */}
      <div className="flex items-center gap-1.5">
        <Zap className="size-4 text-primary fill-primary" />
        <span className="text-xs font-semibold text-primary">
          Lv.{levelInfo.level}
        </span>
        <span className="text-xs font-medium text-primary/70">
          {levelInfo.title}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-20 h-2 rounded-full bg-primary/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${levelInfo.progressPercent}%` }}
        />
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs whitespace-nowrap z-50">
          {levelInfo.isMaxLevel
            ? `Max Level! ${levelInfo.currentXp} XP`
            : `${levelInfo.xpProgress} / ${levelInfo.xpNeeded} XP to Lv.${levelInfo.level + 1}`}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Update HeaderProps to accept XP data**

In `src/components/Header/Header.tsx`, update the `HeaderProps` interface:

```typescript
// Old:
interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

// New:
import type { ILevelInfo } from "@/helpers/calculateLevel";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  levelInfo: ILevelInfo;
}
```

**Step 3: Add XpLevelBar to Header**

In `src/components/Header/Header.tsx`, import and render the `XpLevelBar` in the right-side actions area, before the notification bell:

```tsx
import { XpLevelBar } from "@/components/Header/components/XpLevelBar";

// Inside the component, in the right actions div, add before Bell button:
<XpLevelBar levelInfo={levelInfo} />
```

**Step 4: Update AppShell to accept and pass XP data**

In `src/components/AppShell/AppShell.tsx`:

```typescript
// Old:
import type { ILevelInfo } from "@/helpers/calculateLevel";

interface AppShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  children: React.ReactNode;
}

// New:
interface AppShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  levelInfo: ILevelInfo;
  children: React.ReactNode;
}

// Pass levelInfo to Header:
<Header user={user} levelInfo={levelInfo} />
```

**Step 5: Fetch XP in app layout and pass to AppShell**

In `src/app/(app)/layout.tsx`, fetch the user's XP data from the database and compute level info:

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell/AppShell";
import { calculateLevel } from "@/helpers/calculateLevel";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch user's XP data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totalXp: true, level: true },
  });

  const levelInfo = calculateLevel(user?.totalXp ?? 0);

  return (
    <AppShell user={session.user} levelInfo={levelInfo}>
      {children}
    </AppShell>
  );
}
```

**Step 6: Verify the dev server compiles**

Run:
```bash
npm run dev
```

Expected: No TypeScript errors. XP bar visible in header showing "Lv.1 Spark" with empty progress bar.

**Step 7: Commit**

```bash
git add src/components/Header/ src/components/AppShell/AppShell.tsx src/app/(app)/layout.tsx
git commit -m "feat: add XP level bar to header with persistent display"
```

---

## Task 4: Overview Page — Data Fetching & Stats Helper

**Files:**
- Create: `src/app/(app)/dashboard/helpers/calculateStats.ts`
- Create: `src/types/dashboard.ts`

This task creates the data layer for the overview page. The dashboard page (server component) will use these helpers to compute stats from Channel + ChannelSnapshot data.

**Step 1: Create dashboard types**

Create `src/types/dashboard.ts`:

```typescript
export interface IStatCard {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: string; // Lucide icon name — resolved in the component
}

export interface IRecentVideo {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface IMockCoachNote {
  message: string;
  type: "insight" | "encouragement" | "action";
}

export interface IMockMilestone {
  title: string;
  current: number;
  target: number;
  unit: string;
}

export interface IMockActionItem {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
  source: string; // e.g. "Coach", "Goal"
}
```

**Step 2: Create stats calculation helper**

Create `src/app/(app)/dashboard/helpers/calculateStats.ts`:

```typescript
import type { IStatCard } from "@/types/dashboard";
import { formatNumber, formatPercent } from "@/helpers/formatNumber";

interface ChannelData {
  subscriberCount: number;
  videoCount: number;
  viewCount: bigint;
}

interface SnapshotData {
  subscriberCount: number;
  viewCount: bigint;
  date: Date;
}

/**
 * Calculate the 4 stat cards from channel + snapshot data.
 * Growth is calculated by comparing the latest snapshot to the oldest
 * snapshot from the past 7 days.
 */
export function calculateStats(
  channel: ChannelData,
  snapshots: SnapshotData[]
): IStatCard[] {
  // Sort snapshots by date ascending
  const sorted = [...snapshots].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Find the oldest snapshot from the last 7 days for comparison
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekOldSnapshot = sorted.find(
    (s) => s.date.getTime() >= sevenDaysAgo
  );

  // Calculate subscriber change
  const subChange = weekOldSnapshot
    ? channel.subscriberCount - weekOldSnapshot.subscriberCount
    : 0;

  // Calculate view change
  const viewChange = weekOldSnapshot
    ? Number(channel.viewCount) - Number(weekOldSnapshot.viewCount)
    : 0;

  // Calculate growth percentage
  const growthPercent =
    weekOldSnapshot && weekOldSnapshot.subscriberCount > 0
      ? ((channel.subscriberCount - weekOldSnapshot.subscriberCount) /
          weekOldSnapshot.subscriberCount) *
        100
      : 0;

  return [
    {
      label: "Subscribers",
      value: formatNumber(channel.subscriberCount),
      change: subChange !== 0 ? `${subChange >= 0 ? "+" : ""}${subChange} this week` : "No change this week",
      trend: subChange > 0 ? "up" : subChange < 0 ? "down" : "neutral",
      icon: "Users",
    },
    {
      label: "Total Views",
      value: formatNumber(channel.viewCount),
      change: viewChange !== 0 ? `${viewChange >= 0 ? "+" : ""}${formatNumber(viewChange)} this week` : "No change this week",
      trend: viewChange > 0 ? "up" : viewChange < 0 ? "down" : "neutral",
      icon: "Eye",
    },
    {
      label: "Total Videos",
      value: formatNumber(channel.videoCount),
      change: undefined,
      trend: "neutral",
      icon: "Video",
    },
    {
      label: "Growth",
      value: growthPercent !== 0 ? formatPercent(growthPercent) : "—",
      change: growthPercent !== 0 ? "Subs this week vs last" : "Need more data",
      trend: growthPercent > 0 ? "up" : growthPercent < 0 ? "down" : "neutral",
      icon: "TrendingUp",
    },
  ];
}
```

**Step 3: Commit**

```bash
git add src/types/dashboard.ts src/app/(app)/dashboard/helpers/calculateStats.ts
git commit -m "feat: add dashboard types and stats calculation helper"
```

---

## Task 5: Overview Page — Mock Data for Coach, Milestones, Actions

**Files:**
- Create: `src/app/(app)/dashboard/helpers/mockData.ts`

This provides placeholder data for sections that will be wired to real data later (AI coach, goals, action items). Keeping mocks in one file makes them easy to find and replace.

**Step 1: Create mock data file**

Create `src/app/(app)/dashboard/helpers/mockData.ts`:

```typescript
import type {
  IMockCoachNote,
  IMockMilestone,
  IMockActionItem,
} from "@/types/dashboard";

export const MOCK_COACH_NOTE: IMockCoachNote = {
  message:
    "Your last video got 2x your average views — that topic is resonating. Consider making a follow-up or a deeper dive on the same theme. Doubling down on what works is the fastest way to grow at your stage.",
  type: "insight",
};

export const MOCK_MILESTONES: IMockMilestone[] = [
  {
    title: "Reach 500 Subscribers",
    current: 487,
    target: 500,
    unit: "subscribers",
  },
  {
    title: "Upload 50 Videos",
    current: 38,
    target: 50,
    unit: "videos",
  },
  {
    title: "Hit 25K Total Views",
    current: 24300,
    target: 25000,
    unit: "views",
  },
];

export const MOCK_ACTION_ITEMS: IMockActionItem[] = [
  {
    id: "1",
    text: "Try a shorter intro on your next video — your average view duration drops in the first 15 seconds",
    priority: "high",
    source: "Coach",
  },
  {
    id: "2",
    text: "Your thumbnails could use more contrast — test a bold text overlay on the next upload",
    priority: "medium",
    source: "Coach",
  },
  {
    id: "3",
    text: "You planned to post 3 times this week — you have 1 upload so far",
    priority: "medium",
    source: "Goal",
  },
];
```

**Step 2: Commit**

```bash
git add src/app/(app)/dashboard/helpers/mockData.ts
git commit -m "feat: add mock data for coach note, milestones, and action items"
```

---

## Task 6: Overview Page — UI Components

**Files:**
- Create: `src/app/(app)/dashboard/components/StatCard.tsx`
- Create: `src/app/(app)/dashboard/components/CoachNote.tsx`
- Create: `src/app/(app)/dashboard/components/MilestoneProgress.tsx`
- Create: `src/app/(app)/dashboard/components/ActionItems.tsx`
- Create: `src/app/(app)/dashboard/components/RecentVideos.tsx`
- Create: `src/app/(app)/dashboard/components/BestVideo.tsx`

> **IMPORTANT:** UI design files will be provided by the user before this task is implemented. The component structure and props below are final, but the exact JSX/styling should follow the provided design. The code below is a **structural reference** — adapt the styling to match the design.

**Step 1: Create StatCard component**

Create `src/app/(app)/dashboard/components/StatCard.tsx`:

```tsx
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Eye,
  Video,
  TrendingUp,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IStatCard } from "@/types/dashboard";

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Eye,
  Video,
  TrendingUp,
};

interface StatCardProps {
  stat: IStatCard;
}

export function StatCard({ stat }: StatCardProps) {
  const Icon = ICON_MAP[stat.icon] ?? TrendingUp;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
            {stat.change && (
              <div className="flex items-center gap-1 mt-1">
                {stat.trend === "up" && (
                  <ArrowUp className="size-3 text-green-500" />
                )}
                {stat.trend === "down" && (
                  <ArrowDown className="size-3 text-red-500" />
                )}
                <span
                  className={cn(
                    "text-xs",
                    stat.trend === "up" && "text-green-500",
                    stat.trend === "down" && "text-red-500",
                    stat.trend === "neutral" && "text-muted-foreground"
                  )}
                >
                  {stat.change}
                </span>
              </div>
            )}
          </div>
          <div className="rounded-xl bg-primary/10 p-3">
            <Icon className="size-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Create CoachNote component**

Create `src/app/(app)/dashboard/components/CoachNote.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import type { IMockCoachNote } from "@/types/dashboard";

interface CoachNoteProps {
  note: IMockCoachNote;
}

export function CoachNote({ note }: CoachNoteProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-5 text-primary" />
          Coach&apos;s Note
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {note.message}
        </p>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Create MilestoneProgress component**

Create `src/app/(app)/dashboard/components/MilestoneProgress.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { formatNumber } from "@/helpers/formatNumber";
import type { IMockMilestone } from "@/types/dashboard";

interface MilestoneProgressProps {
  milestones: IMockMilestone[];
}

export function MilestoneProgress({ milestones }: MilestoneProgressProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="size-5 text-primary" />
          Milestones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestones.map((milestone) => {
          const percent = Math.min(
            Math.round((milestone.current / milestone.target) * 100),
            100
          );
          return (
            <div key={milestone.title}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{milestone.title}</span>
                <span className="text-xs text-muted-foreground">
                  {formatNumber(milestone.current)} / {formatNumber(milestone.target)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-primary/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
```

**Step 4: Create ActionItems component**

Create `src/app/(app)/dashboard/components/ActionItems.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IMockActionItem } from "@/types/dashboard";

interface ActionItemsProps {
  items: IMockActionItem[];
}

export function ActionItems({ items }: ActionItemsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="size-5 text-primary" />
          Action Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
          >
            <div
              className={cn(
                "mt-0.5 size-2 rounded-full shrink-0",
                item.priority === "high" && "bg-red-500",
                item.priority === "medium" && "bg-yellow-500",
                item.priority === "low" && "bg-green-500"
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm">{item.text}</p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {item.source}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

**Step 5: Create RecentVideos component**

Create `src/app/(app)/dashboard/components/RecentVideos.tsx`:

```tsx
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";
import { formatNumber } from "@/helpers/formatNumber";
import type { IRecentVideo } from "@/types/dashboard";

interface RecentVideosProps {
  videos: IRecentVideo[];
}

export function RecentVideos({ videos }: RecentVideosProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PlayCircle className="size-5 text-primary" />
          Recent Videos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {videos.map((video) => (
          <div key={video.id} className="flex items-center gap-3">
            {video.thumbnailUrl ? (
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                width={120}
                height={68}
                className="rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-[120px] h-[68px] rounded-lg bg-muted shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{video.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{formatNumber(video.viewCount)} views</span>
                <span>{formatNumber(video.likeCount)} likes</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

**Step 6: Create BestVideo component**

Create `src/app/(app)/dashboard/components/BestVideo.tsx`:

```tsx
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { formatNumber } from "@/helpers/formatNumber";
import type { IRecentVideo } from "@/types/dashboard";

interface BestVideoProps {
  video: IRecentVideo;
}

export function BestVideo({ video }: BestVideoProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="size-5 text-primary" />
          Best Performing
        </CardTitle>
      </CardHeader>
      <CardContent>
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            width={400}
            height={225}
            className="rounded-lg object-cover w-full"
          />
        ) : (
          <div className="w-full aspect-video rounded-lg bg-muted" />
        )}
        <h3 className="text-sm font-semibold mt-3">{video.title}</h3>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>{formatNumber(video.viewCount)} views</span>
          <span>{formatNumber(video.likeCount)} likes</span>
          <span>{formatNumber(video.commentCount)} comments</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 7: Commit**

```bash
git add src/app/(app)/dashboard/components/
git commit -m "feat: add overview page UI components (stats, coach, milestones, actions, videos)"
```

---

## Task 7: Overview Page — Compose the Page

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

This wires everything together. The page is a **server component** that fetches data from Prisma and passes it to the sub-components.

**Step 1: Rewrite the dashboard page**

Replace the contents of `src/app/(app)/dashboard/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateStats } from "@/app/(app)/dashboard/helpers/calculateStats";
import {
  MOCK_COACH_NOTE,
  MOCK_MILESTONES,
  MOCK_ACTION_ITEMS,
} from "@/app/(app)/dashboard/helpers/mockData";
import { StatCard } from "@/app/(app)/dashboard/components/StatCard";
import { CoachNote } from "@/app/(app)/dashboard/components/CoachNote";
import { MilestoneProgress } from "@/app/(app)/dashboard/components/MilestoneProgress";
import { ActionItems } from "@/app/(app)/dashboard/components/ActionItems";
import { RecentVideos } from "@/app/(app)/dashboard/components/RecentVideos";
import { BestVideo } from "@/app/(app)/dashboard/components/BestVideo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncChannelButton } from "@/app/(app)/dashboard/components/sync-channel-button";
import type { IRecentVideo } from "@/types/dashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const channel = await prisma.channel.findUnique({
    where: { userId: session.user.id },
    include: {
      snapshots: {
        orderBy: { date: "asc" },
        where: {
          date: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        },
      },
      videos: {
        orderBy: { publishedAt: "desc" },
        take: 10,
      },
    },
  });

  // No channel connected yet — show onboarding card
  if (!channel) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Connect your YouTube channel</CardTitle>
            <CardDescription>
              ViewFrenzy needs access to your YouTube data to provide personalized coaching.
              Your channel was authorized during sign-in — just click below to sync.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SyncChannelButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const stats = calculateStats(channel, channel.snapshots);

  // Map videos for display
  const recentVideos: IRecentVideo[] = channel.videos.map((v) => ({
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    publishedAt: v.publishedAt,
    viewCount: v.viewCount,
    likeCount: v.likeCount,
    commentCount: v.commentCount,
  }));

  // Best video by view count
  const bestVideo = recentVideos.length > 0
    ? recentVideos.reduce((best, v) => (v.viewCount > best.viewCount ? v : best))
    : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {channel.title}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Coach's Note */}
      <CoachNote note={MOCK_COACH_NOTE} />

      {/* Milestones + Action Items (two columns on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MilestoneProgress milestones={MOCK_MILESTONES} />
        <ActionItems items={MOCK_ACTION_ITEMS} />
      </div>

      {/* Recent Videos + Best Video (two columns on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentVideos videos={recentVideos} />
        </div>
        {bestVideo && <BestVideo video={bestVideo} />}
      </div>
    </div>
  );
}
```

**Step 2: Verify the dev server compiles and renders**

Run:
```bash
npm run dev
```

Expected: Dashboard page renders with stat cards (real data if channel is synced), coach note, milestones, action items (all mock), recent videos and best video (real data).

**Step 3: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx
git commit -m "feat: compose overview page with stats, coach note, milestones, actions, and videos"
```

---

## Task 8: Next.js Image Config — Allow YouTube Thumbnails

**Files:**
- Modify: `next.config.ts` (or `next.config.mjs`)

YouTube thumbnail URLs come from `i.ytimg.com` and `yt3.ggpht.com`. Next.js `<Image>` requires these to be allowed in the config.

**Step 1: Check which config file exists and add image domains**

Look for `next.config.ts` or `next.config.mjs` in the project root. Add the `images` config:

```typescript
// Inside the Next.js config object:
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "i.ytimg.com",
    },
    {
      protocol: "https",
      hostname: "yt3.ggpht.com",
    },
    {
      protocol: "https",
      hostname: "lh3.googleusercontent.com",
    },
  ],
},
```

**Step 2: Restart dev server and verify images load**

Run:
```bash
npm run dev
```

Expected: Video thumbnails render without Next.js image optimization errors.

**Step 3: Commit**

```bash
git add next.config.*
git commit -m "feat: allow YouTube and Google image domains in Next.js config"
```

---

## Summary

| Task | What | Key Files |
|------|------|-----------|
| 1 | DB: Add XP fields to User | `prisma/schema.prisma` |
| 2 | XP constants + calculation helpers + formatNumber | `src/constants/xp.ts`, `src/helpers/calculateLevel.ts`, `src/helpers/formatNumber.ts` |
| 3 | XP Level Bar in Header (persistent) | `src/components/Header/components/XpLevelBar.tsx`, Header, AppShell, layout |
| 4 | Stats calculation helper + dashboard types | `src/types/dashboard.ts`, `src/app/(app)/dashboard/helpers/calculateStats.ts` |
| 5 | Mock data for coach, milestones, actions | `src/app/(app)/dashboard/helpers/mockData.ts` |
| 6 | UI components (StatCard, CoachNote, MilestoneProgress, ActionItems, RecentVideos, BestVideo) | `src/app/(app)/dashboard/components/` |
| 7 | Compose the overview page | `src/app/(app)/dashboard/page.tsx` |
| 8 | Next.js image config for YouTube thumbnails | `next.config.ts` |

### What's real vs mock

| Component | Data Source | Status |
|-----------|-----------|--------|
| Stats cards | Channel + ChannelSnapshot (Prisma) | **Real** |
| XP bar | User.totalXp (Prisma) | **Real** (starts at 0) |
| Recent videos | Video table (Prisma) | **Real** |
| Best video | Video table (Prisma) | **Real** |
| Coach's Note | Hardcoded mock | **Mock** — wire to AI later (Task 7 of main plan) |
| Milestones | Hardcoded mock | **Mock** — wire to Goals later (Task 9 of main plan) |
| Action Items | Hardcoded mock | **Mock** — wire to AI + Goals later |

### What this does NOT include (deferred)

- XP awarding logic (when/how XP is earned) — separate task when features that trigger XP are built
- Real AI coach notes — requires Task 7 (Claude integration)
- Real milestones — requires Task 9 (Goal setting)
- Real action items — requires Task 7 + 9
- Accountability tracker, upcoming deadlines, performance alerts — "nice to have" sections, added later

###Explanation for TASK 6 components
1. StatCard — A single metric card. Four of these sit in a row
   at the top of the dashboard.

  Each card shows:
  - Label: "Subscribers", "Total Views", "Total Videos", or     
  "Growth"
  - Value: The big number (e.g. "487", "24.3K", "38", "+2.5%")  
  - Change text: Context like "+12 this week" or "No change this
   week"
  - Trend indicator: Up arrow (green), down arrow (red), or     
  neutral
  - Icon: Contextual icon (Users, Eye, Video, TrendingUp)       

  This is real data from the YouTube channel.

  ---
  2. CoachNote — A card with a personalized AI coaching message.
   Think of it as the coach "talking" to the creator.

  Shows:
  - Title: "Coach's Note" with a sparkle icon
  - Message: A paragraph of coaching advice (e.g. "Your last    
  video got 2x your average views — that topic is
  resonating...")
  - Type: insight, encouragement, or action (could style        
  differently per type)

  Currently mock data. Will be wired to Claude AI later.        

  ---
  3. MilestoneProgress — Shows progress toward the creator's    
  goals. Multiple progress bars stacked.

  Each milestone shows:
  - Title: e.g. "Reach 500 Subscribers"
  - Progress bar: Visual fill (e.g. 487/500 = 97%)
  - Numbers: "487 / 500" next to the title

  Currently mock data. Will be wired to real Goals later.       

  ---
  4. ActionItems — A to-do list of coaching recommendations and 
  goal reminders.

  Each item shows:
  - Priority dot: Red (high), yellow (medium), green (low)      
  - Text: The action (e.g. "Try a shorter intro on your next    
  video")
  - Source badge: Where it came from — "Coach" or "Goal"        

  Currently mock data. Will be AI-generated later.

  ---
  5. RecentVideos — A list of the creator's latest uploads with 
  quick stats.

  Each video shows:
  - Thumbnail: YouTube thumbnail image (120x68)
  - Title: Video title (truncated if long)
  - Stats: View count + like count

  This is real data from the Video table.

  ---
  6. BestVideo — Highlights the single best-performing video (by
   views) from recent uploads.

  Shows:
  - Title: "Best Performing" with a trophy icon
  - Large thumbnail: Full-width video thumbnail
  - Video title
  - Stats: Views, likes, comments

  This is real data — the video with the highest view count from
   the recent batch.