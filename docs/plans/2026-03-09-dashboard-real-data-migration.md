# Dashboard Real Data Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 3 remaining mock-data dashboard components (Milestone Progress, Coach's Note, Recommended Actions) with real data from the database and AI.

**Architecture:** Milestone Progress is wired to the Goal model via a new CRUD API. Coach's Note is powered by Claude AI analyzing the creator's channel data. Recommended Actions combines AI-generated suggestions with goal-derived action items. Each component gets its own data-fetching logic inside `getDashboardData()`.

**Tech Stack:** Prisma (Goals CRUD), Anthropic Claude API (AI coaching), Next.js server components + API routes

**Dependency chain:** Goals API (Task 1-2) > Milestones (Task 3) > AI backend (Task 4-5) > Coach's Note (Task 6) > Recommended Actions (Task 7)

---

## Task 1: Goals CRUD API — Create & List

The `Goal` model already exists in Prisma. We need API routes for creating and listing goals.

**Files:**
- Create: `src/app/api/goals/route.ts`

**Step 1: Create the goals API route**

```ts
// src/app/api/goals/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, targetValue, currentValue, unit, deadline } = body;

  if (!title || !targetValue || !unit) {
    return NextResponse.json(
      { error: "title, targetValue, and unit are required" },
      { status: 400 }
    );
  }

  const goal = await prisma.goal.create({
    data: {
      userId: session.user.id,
      title,
      targetValue,
      currentValue: currentValue ?? 0,
      unit,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/app/api/goals/route.ts
git commit -m "feat: add goals CRUD API — create and list endpoints"
```

---

## Task 2: Goals CRUD API — Update & Delete

**Files:**
- Create: `src/app/api/goals/[id]/route.ts`

**Step 1: Create the goal update/delete route**

```ts
// src/app/api/goals/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Verify ownership
  const existing = await prisma.goal.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const goal = await prisma.goal.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(goal);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.goal.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/app/api/goals/[id]/route.ts
git commit -m "feat: add goal update and delete API endpoints"
```

---

## Task 3: Wire Milestone Progress to Real Goals

Replace `MOCK_MILESTONES` with real data from the Goal model. Auto-derive channel-based milestones (subscriber/view/video count targets) from channel data when no explicit goals exist.

**Files:**
- Modify: `src/app/(app)/dashboard/data/getDashboardData.ts` — add goals query, map to milestones
- Modify: `src/types/dashboard.ts` — add `recentVideos` field to `IDashboardData` (already done), ensure `IMockMilestone` works for real data too (rename to `IMilestone`)
- Modify: `src/app/(app)/dashboard/page.tsx` — use real milestones instead of `MOCK_MILESTONES`
- Modify: `src/app/(app)/dashboard/helpers/mockData.ts` — remove `MOCK_MILESTONES`

**Step 1: Rename `IMockMilestone` to `IMilestone` in types**

In `src/types/dashboard.ts`, rename `IMockMilestone` to `IMilestone` since it will now represent real data. Update all imports.

**Step 2: Add goals query to `getDashboardData()`**

Add a Prisma query for the user's active (non-completed) goals, and map each to an `IMilestone`. Choose the icon based on the `unit` field:
- `"subscribers"` → `"Users"`
- `"views"` → `"Eye"`
- `"videos"` → `"Video"`
- default → `"Target"`

Also auto-update `currentValue` for subscriber/view/video goals from channel data if a channel exists.

```ts
// Inside getDashboardData(), add to the Promise.all:
userId
  ? prisma.goal.findMany({
      where: { userId, completed: false },
      orderBy: { createdAt: "asc" },
      take: 3,
    })
  : [],
```

Then map goals to milestones:

```ts
function goalIconFromUnit(unit: string): string {
  switch (unit) {
    case "subscribers": return "Users";
    case "views": return "Eye";
    case "videos": return "Video";
    default: return "Target";
  }
}

const milestones: IMilestone[] = goals.map((g) => ({
  title: g.title,
  current: g.currentValue,
  target: g.targetValue,
  unit: g.unit,
  icon: goalIconFromUnit(g.unit),
}));
```

**Step 3: Auto-sync goal currentValue from channel data**

When channel data exists, update any subscriber/view/video goals with real values:

```ts
if (channel && goals.length > 0) {
  for (const goal of goals) {
    let realValue: number | null = null;
    if (goal.unit === "subscribers") realValue = channel.subscriberCount;
    else if (goal.unit === "views") realValue = Number(channel.viewCount);
    else if (goal.unit === "videos") realValue = channel.videoCount;

    if (realValue !== null && realValue !== goal.currentValue) {
      await prisma.goal.update({
        where: { id: goal.id },
        data: {
          currentValue: realValue,
          completed: realValue >= goal.targetValue,
        },
      });
      goal.currentValue = realValue;
    }
  }
}
```

**Step 4: Update dashboard page**

Replace `MOCK_MILESTONES` usage with `milestones` from `getDashboardData()`. Add `milestones` to the `IDashboardData` interface.

**Step 5: Handle empty state**

If no goals exist, `MilestoneProgress` receives an empty array. Add an empty state to the component: "No goals set yet" with a muted icon.

**Step 6: Remove `MOCK_MILESTONES` from mockData.ts**

**Step 7: Verify**

Run: `npx tsc --noEmit && npx next build`
Expected: Clean build, no errors

**Step 8: Commit**

```bash
git commit -m "feat: wire milestone progress to real goals data"
```

---

## Task 4: AI Backend — Create `ai.ts` (Claude API Integration)

Set up the Claude API client with streaming support.

**Files:**
- Create: `src/lib/ai.ts`

**Prerequisites:**
- `ANTHROPIC_API_KEY` environment variable set in `.env.local`
- Install: `npm install @anthropic-ai/sdk`

**Step 1: Create the AI client**

```ts
// src/lib/ai.ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface IAIMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Generate a single AI response (non-streaming).
 * Used for dashboard insights, not chat.
 */
export async function generateInsight(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}

/**
 * Generate a streaming AI response.
 * Used for the chat interface.
 */
export async function generateStreamingResponse(
  systemPrompt: string,
  messages: IAIMessage[]
): Promise<ReadableStream> {
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  return new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(
            new TextEncoder().encode(event.delta.text)
          );
        }
      }
      controller.close();
    },
  });
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/lib/ai.ts
git commit -m "feat: add Claude AI client with insight and streaming helpers"
```

---

## Task 5: AI Backend — Create `ai-context.ts` (Dashboard Context Builder)

Builds the system prompt and user prompt for the dashboard Coach's Note. Assembles the creator's channel data, recent video performance, and goals into context the AI can analyze.

**Files:**
- Create: `src/lib/ai-context.ts`

**Step 1: Create the context builder**

```ts
// src/lib/ai-context.ts
import { prisma } from "@/lib/prisma";
import { daysAgo } from "@/helpers/date";
import { formatNumber } from "@/helpers/formatNumber";

const COACH_SYSTEM_PROMPT = `You are ViewFrenzy Coach, an AI YouTube growth coach for small creators (0-10K subscribers).

Personality: Direct, encouraging, data-driven. You celebrate wins and give honest tactical advice.

Rules:
- Keep insights to 2-3 sentences max
- Reference specific numbers from the creator's data
- Focus on actionable observations, not generic advice
- Match your advice to their growth stage

Growth stages:
- 0-100 subs: Focus on consistency and finding their voice
- 100-500 subs: Identify what's working and double down
- 500-1K subs: Refine strategy, optimize thumbnails and titles
- 1K-5K subs: CTR and retention are critical levers
- 5K-10K subs: Build community and brand`;

/**
 * Build the system prompt for the AI coach.
 */
export function getCoachSystemPrompt(): string {
  return COACH_SYSTEM_PROMPT;
}

/**
 * Build a user prompt for generating a dashboard insight.
 * Includes channel stats, recent video performance, and active goals.
 */
export async function buildDashboardInsightPrompt(
  userId: string
): Promise<string | null> {
  const [channel, recentVideos, goals] = await Promise.all([
    prisma.channel.findUnique({
      where: { userId },
      include: {
        snapshots: {
          orderBy: { date: "desc" },
          take: 7,
        },
      },
    }),
    prisma.video.findMany({
      where: { channel: { userId } },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: {
        title: true,
        publishedAt: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        avgViewDuration: true,
        avgViewPercentage: true,
        ctr: true,
        impressions: true,
      },
    }),
    prisma.goal.findMany({
      where: { userId, completed: false },
      take: 5,
    }),
  ]);

  if (!channel) return null;

  const parts: string[] = [];

  // Channel overview
  parts.push(`## Channel: ${channel.title}`);
  parts.push(`Subscribers: ${formatNumber(channel.subscriberCount)}`);
  parts.push(`Total Views: ${formatNumber(Number(channel.viewCount))}`);
  parts.push(`Total Videos: ${channel.videoCount}`);

  // Recent growth from snapshots
  if (channel.snapshots.length >= 2) {
    const latest = channel.snapshots[0];
    const oldest = channel.snapshots[channel.snapshots.length - 1];
    const subGrowth = latest.subscriberCount - oldest.subscriberCount;
    const viewGrowth = Number(latest.viewCount) - Number(oldest.viewCount);
    parts.push(`\n## Last 7 Days`);
    parts.push(`Subscriber change: ${subGrowth >= 0 ? "+" : ""}${subGrowth}`);
    parts.push(`View change: ${viewGrowth >= 0 ? "+" : ""}${formatNumber(viewGrowth)}`);
  }

  // Recent videos
  if (recentVideos.length > 0) {
    parts.push(`\n## Recent Videos`);
    for (const v of recentVideos) {
      const stats = [
        `${formatNumber(v.viewCount)} views`,
        `${formatNumber(v.likeCount)} likes`,
        `${v.commentCount} comments`,
      ];
      if (v.ctr) stats.push(`${v.ctr.toFixed(1)}% CTR`);
      if (v.avgViewPercentage) stats.push(`${v.avgViewPercentage.toFixed(0)}% avg watched`);
      parts.push(`- "${v.title}" (${stats.join(", ")})`);
    }
  }

  // Active goals
  if (goals.length > 0) {
    parts.push(`\n## Active Goals`);
    for (const g of goals) {
      const pct = Math.round((g.currentValue / g.targetValue) * 100);
      parts.push(`- ${g.title}: ${g.currentValue}/${g.targetValue} ${g.unit} (${pct}%)`);
    }
  }

  parts.push(`\nBased on this data, give a brief coaching insight (2-3 sentences). Focus on the most notable observation — a trend, a win, or an opportunity.`);

  return parts.join("\n");
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/lib/ai-context.ts
git commit -m "feat: add AI context builder for dashboard coaching insights"
```

---

## Task 6: Wire Coach's Note to Real AI

Replace `MOCK_COACH_NOTE` with a real AI-generated insight on the dashboard.

**Files:**
- Modify: `src/app/(app)/dashboard/data/getDashboardData.ts` — add AI insight generation
- Modify: `src/types/dashboard.ts` — rename `IMockCoachNote` to `ICoachNote`
- Modify: `src/app/(app)/dashboard/page.tsx` — use real coach note
- Modify: `src/app/(app)/dashboard/helpers/mockData.ts` — remove `MOCK_COACH_NOTE`

**Step 1: Rename `IMockCoachNote` to `ICoachNote`**

Update the type in `src/types/dashboard.ts` and all import sites.

**Step 2: Add AI insight to `getDashboardData()`**

```ts
import { generateInsight } from "@/lib/ai";
import {
  getCoachSystemPrompt,
  buildDashboardInsightPrompt,
} from "@/lib/ai-context";

// Inside getDashboardData(), after other data fetching:
let coachNote: ICoachNote = {
  message: "Connect your YouTube channel to get personalized coaching insights.",
  type: "encouragement",
  analyzedAt: "just now",
};

if (userId) {
  const insightPrompt = await buildDashboardInsightPrompt(userId);
  if (insightPrompt) {
    try {
      const message = await generateInsight(
        getCoachSystemPrompt(),
        insightPrompt
      );
      coachNote = {
        message,
        type: "insight",
        analyzedAt: "just now",
      };
    } catch {
      coachNote = {
        message: "Unable to generate insight right now. Check back soon!",
        type: "encouragement",
        analyzedAt: "just now",
      };
    }
  }
}
```

Add `coachNote` to the return object and `IDashboardData` interface.

**Step 3: Update dashboard page**

Remove `MOCK_COACH_NOTE` import, use `coachNote` from data.

**Step 4: Consider caching**

The AI call adds latency (~1-2s) to every dashboard load. Consider:
- Caching the insight in the database (add `lastInsight` / `lastInsightAt` to Channel or a new table)
- Only regenerating if the last insight is older than 6 hours
- This can be a follow-up optimization

**Step 5: Verify**

Run: `npx tsc --noEmit && npx next build`

**Step 6: Commit**

```bash
git commit -m "feat: wire coach's note to real AI-generated insights"
```

---

## Task 7: Wire Recommended Actions to Real Data

Replace `MOCK_ACTION_ITEMS` with actions derived from two sources:
1. **Goal-based:** Generated from active goals (e.g., "You're at 487/500 subs — 13 more to go!")
2. **AI-based:** Extracted from the coach's insight (future enhancement)

For now, implement goal-based actions only. AI-based actions require the full chat system and can be added later.

**Files:**
- Modify: `src/app/(app)/dashboard/data/getDashboardData.ts` — generate actions from goals
- Modify: `src/app/(app)/dashboard/helpers/mockData.ts` — remove `MOCK_ACTION_ITEMS`
- Modify: `src/types/dashboard.ts` — rename `IMockActionItem` to `IActionItem`
- Modify: `src/app/(app)/dashboard/page.tsx` — use real actions

**Step 1: Rename `IMockActionItem` to `IActionItem`**

Update the type and all imports.

**Step 2: Add action generation logic**

Create a helper in `src/app/(app)/dashboard/helpers/generateActions.ts`:

```ts
// src/app/(app)/dashboard/helpers/generateActions.ts
import type { Goal } from "@prisma/client";
import type { IActionItem } from "@/types/dashboard";

export function generateActionsFromGoals(goals: Goal[]): IActionItem[] {
  const actions: IActionItem[] = [];

  for (const goal of goals) {
    const pct = Math.round((goal.currentValue / goal.targetValue) * 100);
    const remaining = goal.targetValue - goal.currentValue;

    if (pct >= 90) {
      actions.push({
        id: `goal-${goal.id}-close`,
        text: `Almost there! ${remaining} more ${goal.unit} to hit "${goal.title}"`,
        priority: "high",
        source: "Goal",
      });
    } else if (goal.deadline) {
      const daysLeft = Math.ceil(
        (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft <= 7 && daysLeft > 0) {
        actions.push({
          id: `goal-${goal.id}-deadline`,
          text: `"${goal.title}" deadline in ${daysLeft} day${daysLeft > 1 ? "s" : ""} — currently at ${pct}%`,
          priority: "high",
          source: "Goal",
        });
      } else if (daysLeft <= 0) {
        actions.push({
          id: `goal-${goal.id}-overdue`,
          text: `"${goal.title}" is past its deadline — ${pct}% complete. Update or close it?`,
          priority: "medium",
          source: "Goal",
        });
      }
    } else if (pct < 50) {
      actions.push({
        id: `goal-${goal.id}-behind`,
        text: `"${goal.title}" is at ${pct}% — ${remaining} ${goal.unit} to go`,
        priority: "medium",
        source: "Goal",
      });
    }
  }

  return actions;
}
```

**Step 3: Wire into `getDashboardData()`**

```ts
import { generateActionsFromGoals } from "@/app/(app)/dashboard/helpers/generateActions";

// After goals query:
const actionItems = generateActionsFromGoals(goals);
```

Add `actionItems` to return object.

**Step 4: Handle empty state**

If no actions generated (no goals or all goals on track), show: "You're on track! No actions needed right now." in the `RecommendedActions` component.

**Step 5: Update dashboard page**

Remove `MOCK_ACTION_ITEMS`, use `actionItems` from data.

**Step 6: Remove all remaining mocks**

After this task, `mockData.ts` should only contain `MOCK_STATS` (used as fallback when no channel exists). If `MOCK_STATS` is the only export left, consider whether it should stay or if the stat cards should also get an empty state. (For now, keep `MOCK_STATS` — it provides a reasonable preview for unconnected accounts.)

**Step 7: Verify**

Run: `npx tsc --noEmit && npx next build`

**Step 8: Commit**

```bash
git commit -m "feat: wire recommended actions to real goal-based data"
```

---

## Summary

| Task | Component | Data Source | Depends On |
|------|-----------|------------|------------|
| 1-2 | Goals API | Prisma `Goal` model | Nothing (model exists) |
| 3 | Milestone Progress | Goals API + Channel data | Tasks 1-2 |
| 4-5 | AI Backend | Claude API + Channel/Video data | Nothing |
| 6 | Coach's Note | AI-generated insight | Tasks 4-5 |
| 7 | Recommended Actions | Goal-derived rules | Tasks 1-3 |

**After all tasks:** `mockData.ts` only contains `MOCK_STATS` as a fallback. All other dashboard data comes from the database or AI.
