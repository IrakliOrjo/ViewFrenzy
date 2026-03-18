# Goals & Coaching System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Goals & Coaching system — CoachNote, CoachingTask models, domain services, daily coaching cron, coaching page, and overview page real-data integration.

**Architecture:** Three new Prisma models (CoachNote, CoachingTask + Goal index). Domain services follow the existing `data.ts` + `service.ts` pattern with cache invalidation. A daily cron orchestrates system-rule checks (free) + one AI call per user. The overview page replaces mock data with real queries; a new `/dashboard/coaching` page shows all tasks and coach notes.

**Tech Stack:** Next.js 15 (App Router, RSC), TypeScript, Prisma/Neon PostgreSQL, Anthropic Claude API, Tailwind CSS + shadcn/ui, Server Actions.

**Spec:** `docs/superpowers/specs/2026-03-14-goals-coaching-system-design.md`

---

## File Structure

### New files to create

```
prisma/schema.prisma                                    (modify — add CoachNote, CoachingTask, Goal index, User relations)
src/constants/coaching.ts                               (create — task/note type constants)
src/types/coaching.ts                                   (create — CoachNote/CoachingTask TypeScript interfaces)

src/lib/domains/coach-note/coach-note.data.ts           (create — Prisma queries)
src/lib/domains/coach-note/coach-note.service.ts        (create — business logic + cache invalidation)
src/lib/domains/coaching-task/coaching-task.data.ts      (create — Prisma queries)
src/lib/domains/coaching-task/coaching-task.service.ts   (create — business logic + cache invalidation)
src/lib/domains/coaching/daily-coaching.service.ts       (create — orchestrates daily cron: system rules + AI + expiry)
src/lib/domains/coaching/system-rules.ts                (create — individual system rule check functions)

src/app/api/cron/daily-coaching/route.ts                (create — cron API endpoint)

src/app/(app)/dashboard/actions/goal-actions.ts          (create — server actions for goal CRUD via dialog)
src/app/(app)/dashboard/actions/coaching-task-actions.ts  (create — server actions for complete/dismiss)

src/app/(app)/dashboard/coaching/page.tsx                (create — coaching page)
src/app/(app)/dashboard/coaching/components/CoachNoteCard.tsx    (create — prominent coach note display)
src/app/(app)/dashboard/coaching/components/ActiveTasks.tsx      (create — pending tasks list)
src/app/(app)/dashboard/coaching/components/CompletedTasks.tsx   (create — collapsible completed section)
src/app/(app)/dashboard/coaching/components/TaskItem.tsx         (create — single task row with actions)

src/app/(app)/dashboard/components/GoalDialog.tsx        (create — add/edit goal dialog on overview)
```

### Existing files to modify

```
src/constants/navigation.ts                             (modify — replace "Goals" with "Coaching")
src/types/dashboard.ts                                  (modify — remove mock types, add real types)
src/lib/ai-context.ts                                   (modify — add coach note to creator context)
src/app/(app)/dashboard/overview/page.tsx                (modify — replace mock data with real DB queries)
src/app/(app)/dashboard/components/CoachNote.tsx          (modify — accept real CoachNote data)
src/app/(app)/dashboard/components/RecommendedActions.tsx (modify — accept real CoachingTask data + action buttons)
src/app/(app)/dashboard/components/MilestoneProgress.tsx  (modify — accept real Goal data + click-to-edit)
src/app/(app)/dashboard/data/getDashboardData.ts         (modify — fetch goals, coach note, tasks)
src/app/(app)/dashboard/helpers/mockData.ts              (modify — remove coach/milestone/action mocks once replaced)
```

### Files to delete

```
src/app/(app)/dashboard/goals/page.tsx                   (delete — stub page, goals live on overview)
```

---

## Chunk 1: Schema, Constants, Types & Domain Data Layer

This chunk sets up the foundation — database models, constants, types, and the raw Prisma query layer. No UI, no business logic yet. Everything else builds on this.

### Task 1: Prisma Schema Updates

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `@@index` to Goal model**

In `prisma/schema.prisma`, add the index to the existing Goal model:

```prisma
model Goal {
  id              String    @id @default(cuid())
  userId          String
  title           String
  description     String?
  targetValue     Float?
  currentValue    Float?
  unit            String?
  deadline        DateTime?
  completed       Boolean   @default(false)
  calendarEventId String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, completed])
}
```

- [ ] **Step 2: Add CoachNote model**

Add after the Goal model:

```prisma
model CoachNote {
  id        String   @id @default(cuid())
  userId    String
  message   String
  type      String   @default("insight")
  source    String   @default("daily_cron")
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}
```

- [ ] **Step 3: Add CoachingTask model**

Add after CoachNote:

```prisma
model CoachingTask {
  id           String    @id @default(cuid())
  userId       String
  title        String
  description  String?
  xpReward     Int       @default(20)
  priority     String    @default("medium")
  status       String    @default("pending")
  source       String
  sourceDetail String?
  challengeId  String?
  dayNumber    Int?
  completedAt  DateTime?
  expiresAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([userId, status, priority])
}
```

Note: `challengeId` relation to `UserChallenge` is NOT added yet — that model doesn't exist. The field is a plain `String?` for now. When the gamification spec adds `UserChallenge`, the relation will be added then.

- [ ] **Step 4: Add relations to User model**

Update the User model to include the new relations:

```prisma
model User {
  id                String             @id @default(cuid())
  name              String?
  email             String?            @unique
  emailVerified     DateTime?
  image             String?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  level             Int                @default(1)
  totalXp           Int                @default(0)
  accounts          Account[]
  channel           Channel?
  coachNotes        CoachNote[]
  coachingTasks     CoachingTask[]
  conversations     Conversation[]
  creatorProfile    CreatorProfile?
  goals             Goal[]
  ideas             Idea[]
  plans             Plan[]
  pushSubscriptions PushSubscription[]
  sessions          Session[]
  subscription      Subscription?
}
```

- [ ] **Step 5: Push schema to database and regenerate client**

Run:
```bash
npx prisma db push
npx prisma generate
```

Expected: Schema pushed successfully, Prisma client regenerated with `CoachNote` and `CoachingTask` types.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add CoachNote, CoachingTask models and Goal index to schema"
```

---

### Task 2: Constants & Types

**Files:**
- Create: `src/constants/coaching.ts`
- Create: `src/types/coaching.ts`

- [ ] **Step 1: Create coaching constants**

Create `src/constants/coaching.ts`:

```typescript
export const TASK_PRIORITIES = ["high", "medium", "low"] as const;
export const TASK_STATUSES = ["pending", "in_progress", "completed", "dismissed"] as const;
export const TASK_SOURCES = ["ai", "system", "chat", "user", "challenge"] as const;

export const NOTE_TYPES = ["insight", "skill_tip", "encouragement", "observation"] as const;
export const NOTE_SOURCES = ["daily_cron", "chat"] as const;

export const TASK_EXPIRY_DAYS = 5;
export const TASK_DASHBOARD_LIMIT = 3;
export const COMPLETED_HISTORY_DAYS = 7;
```

- [ ] **Step 2: Create coaching types**

Create `src/types/coaching.ts`:

```typescript
import type {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_SOURCES,
  NOTE_TYPES,
  NOTE_SOURCES,
} from "@/constants/coaching";

export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskSource = (typeof TASK_SOURCES)[number];
export type NoteType = (typeof NOTE_TYPES)[number];
export type NoteSource = (typeof NOTE_SOURCES)[number];

export interface ICoachNote {
  id: string;
  userId: string;
  message: string;
  type: NoteType;
  source: NoteSource;
  createdAt: Date;
}

export interface ICoachingTask {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  xpReward: number;
  priority: TaskPriority;
  status: TaskStatus;
  source: TaskSource;
  sourceDetail: string | null;
  challengeId: string | null;
  dayNumber: number | null;
  completedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 3: Verify types compile**

Run:
```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors related to the new files.

- [ ] **Step 4: Commit**

```bash
git add src/constants/coaching.ts src/types/coaching.ts
git commit -m "feat: add coaching constants and TypeScript types"
```

---

### Task 3: Coach Note Data Layer

**Files:**
- Create: `src/lib/domains/coach-note/coach-note.data.ts`

- [ ] **Step 1: Create coach-note data layer**

Create `src/lib/domains/coach-note/coach-note.data.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import type { NoteType, NoteSource } from "@/types/coaching";

export interface ICreateCoachNoteInput {
  message: string;
  type: NoteType;
  source: NoteSource;
}

export async function getCurrentNote(userId: string) {
  return prisma.coachNote.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCoachNote(userId: string, data: ICreateCoachNoteInput) {
  return prisma.coachNote.create({
    data: { userId, ...data },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/domains/coach-note/coach-note.data.ts
git commit -m "feat: add coach note data layer"
```

---

### Task 4: Coaching Task Data Layer

**Files:**
- Create: `src/lib/domains/coaching-task/coaching-task.data.ts`

- [ ] **Step 1: Create coaching-task data layer**

Create `src/lib/domains/coaching-task/coaching-task.data.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import type { TaskPriority, TaskSource } from "@/types/coaching";

export interface ICreateCoachingTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  source: TaskSource;
  sourceDetail?: string;
  xpReward?: number;
  expiresAt?: Date;
}

export async function getAllPendingTasks(userId: string) {
  const tasks = await prisma.coachingTask.findMany({
    where: { userId, status: "pending" },
    orderBy: { createdAt: "asc" },
  });

  // Prisma doesn't support CASE-based ordering, so we sort in app
  const priorityOrder: Record<string, number> = { high: 1, medium: 2, low: 3 };
  tasks.sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 2;
    const pb = priorityOrder[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return tasks;
}

export async function getTopTasks(userId: string, limit: number) {
  const tasks = await getAllPendingTasks(userId);
  return tasks.slice(0, limit);
}

export async function getCompletedTasks(userId: string, sinceDays: number) {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  return prisma.coachingTask.findMany({
    where: {
      userId,
      status: "completed",
      completedAt: { gte: since },
    },
    orderBy: { completedAt: "desc" },
  });
}

export async function completeTask(taskId: string) {
  return prisma.coachingTask.update({
    where: { id: taskId },
    data: { status: "completed", completedAt: new Date() },
  });
}

export async function dismissTask(taskId: string) {
  return prisma.coachingTask.update({
    where: { id: taskId },
    data: { status: "dismissed" },
  });
}

export async function createCoachingTask(userId: string, data: ICreateCoachingTaskInput) {
  return prisma.coachingTask.create({
    data: { userId, ...data },
  });
}

export async function getTaskById(taskId: string) {
  return prisma.coachingTask.findUnique({ where: { id: taskId } });
}

export async function hasPendingTaskWithSourceDetail(userId: string, sourceDetail: string) {
  const existing = await prisma.coachingTask.findFirst({
    where: { userId, status: "pending", sourceDetail },
    select: { id: true },
  });
  return existing !== null;
}

export async function expireStaleTasks(userId: string): Promise<number> {
  const now = new Date();
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  // Dismiss tasks with explicit expiresAt that has passed
  const result1 = await prisma.coachingTask.updateMany({
    where: {
      userId,
      status: "pending",
      expiresAt: { not: null, lt: now },
    },
    data: { status: "dismissed" },
  });

  // Dismiss tasks with no expiresAt that are older than 5 days
  const result2 = await prisma.coachingTask.updateMany({
    where: {
      userId,
      status: "pending",
      expiresAt: null,
      createdAt: { lt: fiveDaysAgo },
    },
    data: { status: "dismissed" },
  });

  return result1.count + result2.count;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/domains/coaching-task/coaching-task.data.ts
git commit -m "feat: add coaching task data layer"
```

---

### Task 5: Domain Service Layer

**Files:**
- Create: `src/lib/domains/coach-note/coach-note.service.ts`
- Create: `src/lib/domains/coaching-task/coaching-task.service.ts`

- [ ] **Step 1: Create coach-note service**

Create `src/lib/domains/coach-note/coach-note.service.ts`:

```typescript
import {
  getCurrentNote,
  createCoachNote,
} from "@/lib/domains/coach-note/coach-note.data";
import type { ICreateCoachNoteInput } from "@/lib/domains/coach-note/coach-note.data";
import { withCacheInvalidation } from "@/lib/domains/shared/with-cache-invalidation";

export async function getCurrentNoteForUser(userId: string) {
  return getCurrentNote(userId);
}

export async function createNoteForUser(userId: string, data: ICreateCoachNoteInput) {
  return withCacheInvalidation(userId, () => createCoachNote(userId, data));
}
```

- [ ] **Step 2: Create coaching-task service**

Create `src/lib/domains/coaching-task/coaching-task.service.ts`:

```typescript
import {
  getTopTasks,
  getAllPendingTasks,
  getCompletedTasks,
  completeTask,
  dismissTask,
  createCoachingTask,
  getTaskById,
  expireStaleTasks,
} from "@/lib/domains/coaching-task/coaching-task.data";
import type { ICreateCoachingTaskInput } from "@/lib/domains/coaching-task/coaching-task.data";
import { withCacheInvalidation } from "@/lib/domains/shared/with-cache-invalidation";

export async function getTopTasksForUser(userId: string, limit: number) {
  return getTopTasks(userId, limit);
}

export async function getAllPendingTasksForUser(userId: string) {
  return getAllPendingTasks(userId);
}

export async function getCompletedTasksForUser(userId: string, sinceDays: number) {
  return getCompletedTasks(userId, sinceDays);
}

export async function completeTaskForUser(userId: string, taskId: string) {
  const task = await getTaskById(taskId);
  if (!task || task.userId !== userId) {
    throw new Error("Task not found");
  }
  return withCacheInvalidation(userId, () => completeTask(taskId));
}

export async function dismissTaskForUser(userId: string, taskId: string) {
  const task = await getTaskById(taskId);
  if (!task || task.userId !== userId) {
    throw new Error("Task not found");
  }
  return withCacheInvalidation(userId, () => dismissTask(taskId));
}

export async function createTaskForUser(userId: string, data: ICreateCoachingTaskInput) {
  return withCacheInvalidation(userId, () => createCoachingTask(userId, data));
}

export async function expireStaleTasksForUser(userId: string) {
  return expireStaleTasks(userId);
}
```

- [ ] **Step 3: Verify compilation**

Run:
```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/domains/coach-note/coach-note.service.ts src/lib/domains/coaching-task/coaching-task.service.ts
git commit -m "feat: add coach note and coaching task service layers"
```

---

## Chunk 2: Daily Coaching Cron (System Rules + AI + API Route)

This chunk implements the daily coaching cron — the engine that generates coaching content. System rules are checked first (free), then one AI call per user generates a note + tasks, then stale tasks are expired.

### Task 6: System Rules

**Files:**
- Create: `src/lib/domains/coaching/system-rules.ts`

- [ ] **Step 1: Create system rules module**

Create `src/lib/domains/coaching/system-rules.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { hasPendingTaskWithSourceDetail, createCoachingTask } from "@/lib/domains/coaching-task/coaching-task.data";
import type { TaskPriority } from "@/types/coaching";

interface ISystemRuleResult {
  rule: string;
  created: boolean;
}

export async function runSystemRules(userId: string): Promise<ISystemRuleResult[]> {
  const results: ISystemRuleResult[] = [];

  results.push(await checkUploadGap(userId));
  results.push(...await checkGoalDeadlines(userId));
  results.push(...await checkGoalNearComplete(userId));
  results.push(...await checkStalePlans(userId));
  results.push(await checkIdleIdeas(userId));

  return results.filter((r) => r.created);
}

async function checkUploadGap(userId: string): Promise<ISystemRuleResult> {
  const sourceDetail = "upload_gap";

  if (await hasPendingTaskWithSourceDetail(userId, sourceDetail)) {
    return { rule: "upload_gap", created: false };
  }

  const channel = await prisma.channel.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!channel) return { rule: "upload_gap", created: false };

  const latestVideo = await prisma.video.findFirst({
    where: { channelId: channel.id },
    orderBy: { publishedAt: "desc" },
    select: { publishedAt: true },
  });

  if (!latestVideo) return { rule: "upload_gap", created: false };

  const daysSinceUpload = Math.floor(
    (Date.now() - latestVideo.publishedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceUpload < 4) return { rule: "upload_gap", created: false };

  const priority: TaskPriority = daysSinceUpload >= 7 ? "high" : "medium";

  await createCoachingTask(userId, {
    title: `It's been ${daysSinceUpload} days since your last upload`,
    priority,
    source: "system",
    sourceDetail,
  });

  return { rule: "upload_gap", created: true };
}

async function checkGoalDeadlines(userId: string): Promise<ISystemRuleResult[]> {
  const results: ISystemRuleResult[] = [];
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const goals = await prisma.goal.findMany({
    where: {
      userId,
      completed: false,
      deadline: { not: null, lte: sevenDaysFromNow, gt: now },
    },
  });

  for (const goal of goals) {
    const sourceDetail = `goal_deadline:${goal.id}`;

    if (await hasPendingTaskWithSourceDetail(userId, sourceDetail)) {
      results.push({ rule: "goal_deadline", created: false });
      continue;
    }

    const daysLeft = Math.ceil(
      (goal.deadline!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const priority: TaskPriority = daysLeft < 3 ? "high" : "medium";

    let progressText = "";
    if (goal.currentValue !== null && goal.targetValue !== null && goal.targetValue > 0) {
      const pct = Math.round((goal.currentValue / goal.targetValue) * 100);
      progressText = ` — you're at ${pct}%`;
    }

    await createCoachingTask(userId, {
      title: `Your goal "${goal.title}" deadline is in ${daysLeft} day${daysLeft === 1 ? "" : "s"}${progressText}`,
      priority,
      source: "system",
      sourceDetail,
    });

    results.push({ rule: "goal_deadline", created: true });
  }

  return results;
}

async function checkGoalNearComplete(userId: string): Promise<ISystemRuleResult[]> {
  const results: ISystemRuleResult[] = [];

  const goals = await prisma.goal.findMany({
    where: {
      userId,
      completed: false,
      targetValue: { not: null },
      currentValue: { not: null },
    },
  });

  for (const goal of goals) {
    if (goal.targetValue === null || goal.currentValue === null) continue;
    if (goal.currentValue < goal.targetValue * 0.9) continue;

    const sourceDetail = `goal_near_complete:${goal.id}`;
    if (await hasPendingTaskWithSourceDetail(userId, sourceDetail)) {
      results.push({ rule: "goal_near_complete", created: false });
      continue;
    }

    const remaining = Math.ceil(goal.targetValue - goal.currentValue);
    const unit = goal.unit ?? "";

    await createCoachingTask(userId, {
      title: `You're ${remaining} ${unit} away from your goal "${goal.title}" — push for it!`,
      priority: "high",
      source: "system",
      sourceDetail,
    });

    results.push({ rule: "goal_near_complete", created: true });
  }

  return results;
}

async function checkStalePlans(userId: string): Promise<ISystemRuleResult[]> {
  const results: ISystemRuleResult[] = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const stalePlans = await prisma.plan.findMany({
    where: {
      userId,
      status: "in_progress",
      updatedAt: { lt: sevenDaysAgo },
    },
  });

  for (const plan of stalePlans) {
    const sourceDetail = `plan_stale:${plan.id}`;
    if (await hasPendingTaskWithSourceDetail(userId, sourceDetail)) {
      results.push({ rule: "plan_stale", created: false });
      continue;
    }

    const daysSinceUpdate = Math.floor(
      (Date.now() - plan.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    await createCoachingTask(userId, {
      title: `Your plan "${plan.title}" has been in progress for ${daysSinceUpdate} days`,
      priority: "medium",
      source: "system",
      sourceDetail,
    });

    results.push({ rule: "plan_stale", created: true });
  }

  return results;
}

async function checkIdleIdeas(userId: string): Promise<ISystemRuleResult> {
  const sourceDetail = "idle_ideas";

  if (await hasPendingTaskWithSourceDetail(userId, sourceDetail)) {
    return { rule: "idle_ideas", created: false };
  }

  const ideaCount = await prisma.idea.count({
    where: { userId, status: "idea" },
  });

  if (ideaCount < 3) return { rule: "idle_ideas", created: false };

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const recentPlanFromIdea = await prisma.plan.findFirst({
    where: {
      userId,
      sourceIdeaId: { not: null },
      createdAt: { gte: fourteenDaysAgo },
    },
    select: { id: true },
  });

  if (recentPlanFromIdea) return { rule: "idle_ideas", created: false };

  await createCoachingTask(userId, {
    title: `You have ${ideaCount} ideas waiting — pick one to develop`,
    priority: "low",
    source: "system",
    sourceDetail,
  });

  return { rule: "idle_ideas", created: true };
}
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/domains/coaching/system-rules.ts
git commit -m "feat: add system rule checks for daily coaching cron"
```

---

### Task 7: Daily Coaching Service (Orchestrator)

**Files:**
- Create: `src/lib/domains/coaching/daily-coaching.service.ts`

- [ ] **Step 1: Create daily coaching service**

This file orchestrates the full daily flow: system rules → AI generation → expiry cleanup.

Create `src/lib/domains/coaching/daily-coaching.service.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { runSystemRules } from "@/lib/domains/coaching/system-rules";
import { createCoachNote } from "@/lib/domains/coach-note/coach-note.data";
import { createCoachingTask, expireStaleTasks, getAllPendingTasks } from "@/lib/domains/coaching-task/coaching-task.data";
import { buildCreatorContext } from "@/lib/ai-context";
import type { TaskPriority } from "@/types/coaching";
import type { NoteType } from "@/types/coaching";

interface IDailyCoachingResult {
  userId: string;
  systemTasksCreated: number;
  aiNoteCreated: boolean;
  aiTasksCreated: number;
  tasksExpired: number;
  error?: string;
}

export async function runDailyCoachingForUser(userId: string): Promise<IDailyCoachingResult> {
  const result: IDailyCoachingResult = {
    userId,
    systemTasksCreated: 0,
    aiNoteCreated: false,
    aiTasksCreated: 0,
    tasksExpired: 0,
  };

  // Step 1: System-rule task generation (free, no AI)
  const systemResults = await runSystemRules(userId);
  result.systemTasksCreated = systemResults.length;

  // Step 2: AI generation (one call per user)
  try {
    const aiResult = await generateAICoaching(userId);
    result.aiNoteCreated = aiResult.noteCreated;
    result.aiTasksCreated = aiResult.tasksCreated;
  } catch (error) {
    result.error = error instanceof Error ? error.message : "AI generation failed";
  }

  // Step 3: Expiry cleanup
  result.tasksExpired = await expireStaleTasks(userId);

  return result;
}

async function generateAICoaching(userId: string): Promise<{ noteCreated: boolean; tasksCreated: number }> {
  const [creatorContext, pendingTasks] = await Promise.all([
    buildCreatorContext(userId),
    getAllPendingTasks(userId),
  ]);

  const pendingTaskTitles = pendingTasks.map((t) => `- ${t.title}`).join("\n");

  const prompt = `You are the ViewFrenzy coaching engine. Based on the creator's current data, generate personalized coaching content.

## Creator Context
${creatorContext}

## Existing Pending Tasks (do NOT duplicate these)
${pendingTaskTitles || "No pending tasks."}

## Instructions
Respond with ONLY a JSON object (no markdown, no code fences) in this exact format:
{
  "note": {
    "message": "A personalized tip or insight based on the creator's data",
    "type": "insight | skill_tip | encouragement | observation"
  },
  "tasks": [
    {
      "title": "A specific, actionable task",
      "priority": "high | medium | low"
    }
  ]
}

Rules:
- Generate exactly 1 note and 1-2 tasks
- Tasks must be specific and actionable (not vague like "improve your content")
- Do not duplicate any existing pending tasks
- Base advice on actual data patterns when possible
- Note type should match the content: "insight" for data observations, "skill_tip" for technique advice, "encouragement" for motivational messages, "observation" for behavioral patterns`;

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI response contained no text content");
  }

  let parsed: { note: { message: string; type: string }; tasks: { title: string; priority: string }[] };
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new Error(`Failed to parse AI coaching response: ${textBlock.text.substring(0, 200)}`);
  }

  // Save note
  const validNoteTypes = ["insight", "skill_tip", "encouragement", "observation"];
  const noteType = validNoteTypes.includes(parsed.note.type) ? parsed.note.type : "insight";

  await createCoachNote(userId, {
    message: parsed.note.message,
    type: noteType as NoteType,
    source: "daily_cron",
  });

  // Save tasks
  const validPriorities = ["high", "medium", "low"];
  let tasksCreated = 0;
  for (const task of parsed.tasks.slice(0, 2)) {
    const priority = validPriorities.includes(task.priority) ? task.priority : "medium";
    await createCoachingTask(userId, {
      title: task.title,
      priority: priority as TaskPriority,
      source: "ai",
    });
    tasksCreated++;
  }

  return { noteCreated: true, tasksCreated };
}

export async function getActiveUsers(): Promise<string[]> {
  const users = await prisma.channel.findMany({
    select: { userId: true },
  });
  return users.map((u) => u.userId);
}
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/domains/coaching/daily-coaching.service.ts
git commit -m "feat: add daily coaching service orchestrator"
```

---

### Task 8: Cron API Route

**Files:**
- Create: `src/app/api/cron/daily-coaching/route.ts`

- [ ] **Step 1: Create cron API route**

Create `src/app/api/cron/daily-coaching/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { runDailyCoachingForUser, getActiveUsers } from "@/lib/domains/coaching/daily-coaching.service";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userIds = await getActiveUsers();

  const results = [];
  const errors = [];

  for (const userId of userIds) {
    try {
      const result = await runDailyCoachingForUser(userId);
      results.push(result);
      if (result.error) {
        errors.push({ userId, error: result.error });
      }
    } catch (error) {
      errors.push({
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    errorCount: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/cron/daily-coaching/route.ts
git commit -m "feat: add daily coaching cron API route"
```

---

## Chunk 3: Server Actions, Navigation & AI Context Updates

This chunk wires up the server actions (goal CRUD + task complete/dismiss), updates navigation, and adds coach note to the AI context.

### Task 9: Goal Server Actions

**Files:**
- Create: `src/app/(app)/dashboard/actions/goal-actions.ts`

- [ ] **Step 1: Update IUpdateGoalInput to support null deadline**

In `src/lib/domains/goal/goal.data.ts`, update `IUpdateGoalInput` to allow `null` for `deadline` (needed to clear a deadline):

```typescript
export interface IUpdateGoalInput {
  title?: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  deadline?: Date | null;
  completed?: boolean;
}
```

- [ ] **Step 2: Create goal server actions**

Create `src/app/(app)/dashboard/actions/goal-actions.ts`:

```typescript
"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createGoalForUser,
  updateGoalForUser,
  deleteGoalForUser,
} from "@/lib/domains/goal/goal.service";
import { getGoalById } from "@/lib/domains/goal/goal.data";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function createGoalAction(data: {
  title: string;
  targetValue: number;
  unit: string;
  deadline?: string; // ISO string from date picker
}) {
  try {
    const userId = await getUserId();
    const goal = await createGoalForUser(userId, {
      title: data.title,
      targetValue: data.targetValue,
      currentValue: 0,
      unit: data.unit,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    });
    revalidatePath("/dashboard/overview");
    revalidatePath("/dashboard/coaching");
    return { success: true, data: { id: goal.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create goal",
    };
  }
}

export async function updateGoalAction(
  id: string,
  data: {
    title?: string;
    targetValue?: number;
    unit?: string;
    deadline?: string | null;
  }
) {
  try {
    const userId = await getUserId();
    const goal = await getGoalById(id);
    if (!goal || goal.userId !== userId) {
      return { success: false, error: "Goal not found" };
    }
    await updateGoalForUser(userId, id, {
      title: data.title,
      targetValue: data.targetValue,
      unit: data.unit,
      deadline: data.deadline === null ? null : data.deadline ? new Date(data.deadline) : undefined,
    });
    revalidatePath("/dashboard/overview");
    revalidatePath("/dashboard/coaching");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update goal",
    };
  }
}

export async function deleteGoalAction(id: string) {
  try {
    const userId = await getUserId();
    const goal = await getGoalById(id);
    if (!goal || goal.userId !== userId) {
      return { success: false, error: "Goal not found" };
    }
    await deleteGoalForUser(userId, id);
    revalidatePath("/dashboard/overview");
    revalidatePath("/dashboard/coaching");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete goal",
    };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/domains/goal/goal.data.ts src/app/(app)/dashboard/actions/goal-actions.ts
git commit -m "feat: add goal server actions for overview dialog"
```

---

### Task 10: Coaching Task Server Actions

**Files:**
- Create: `src/app/(app)/dashboard/actions/coaching-task-actions.ts`

- [ ] **Step 1: Create coaching task server actions**

Create `src/app/(app)/dashboard/actions/coaching-task-actions.ts`:

```typescript
"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  completeTaskForUser,
  dismissTaskForUser,
} from "@/lib/domains/coaching-task/coaching-task.service";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function completeTaskAction(taskId: string) {
  try {
    const userId = await getUserId();
    await completeTaskForUser(userId, taskId);
    revalidatePath("/dashboard/overview");
    revalidatePath("/dashboard/coaching");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete task",
    };
  }
}

export async function dismissTaskAction(taskId: string) {
  try {
    const userId = await getUserId();
    await dismissTaskForUser(userId, taskId);
    revalidatePath("/dashboard/overview");
    revalidatePath("/dashboard/coaching");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to dismiss task",
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/dashboard/actions/coaching-task-actions.ts
git commit -m "feat: add coaching task server actions"
```

---

### Task 11: Navigation Update

**Files:**
- Modify: `src/constants/navigation.ts`

- [ ] **Step 1: Replace Goals nav item with Coaching**

In `src/constants/navigation.ts`, replace `Target` import and the "Goals" entry:

Replace:
```typescript
import {
  LayoutDashboard,
  Columns3,
  PenSquare,
  Target,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";
```

With:
```typescript
import {
  LayoutDashboard,
  Columns3,
  PenSquare,
  Lightbulb,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";
```

And replace the NAV_ITEMS entry:
```typescript
  { label: "Goals", href: "/dashboard/goals", icon: Target },
```
With:
```typescript
  { label: "Coaching", href: "/dashboard/coaching", icon: Lightbulb },
```

- [ ] **Step 2: Delete goals stub page**

Delete `src/app/(app)/dashboard/goals/page.tsx`.

- [ ] **Step 3: Verify the app compiles**

Run:
```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/constants/navigation.ts
git rm src/app/\(app\)/dashboard/goals/page.tsx
git commit -m "feat: replace Goals nav with Coaching, delete goals stub page"
```

---

### Task 12: AI Context — Add Coach Note

**Files:**
- Modify: `src/lib/ai-context.ts`

- [ ] **Step 1: Add coach note to creator context**

In `src/lib/ai-context.ts`:

1. Add `CoachNote` to imports:
```typescript
import type { Channel, ChannelSnapshot, CoachNote, CreatorProfile, Goal, Idea, Video } from "@/generated/prisma/client";
```

2. Add `coachNote` to `ICreatorData`:
```typescript
interface ICreatorData {
  channel: ChannelWithRelations | null;
  goals: Goal[];
  ideas: Idea[];
  creatorProfile: CreatorProfile | null;
  coachNote: CoachNote | null;
}
```

3. Add coach note fetch to `fetchCreatorData`:
```typescript
const [channel, goals, ideas, creatorProfile, coachNote] = await Promise.all([
  // ... existing queries ...
  prisma.coachNote.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  }),
]);

const data: ICreatorData = { channel, goals, ideas, creatorProfile, coachNote };
```

4. Add format function:
```typescript
function formatCoachNote(note: CoachNote): string {
  return `## Current Coach Note\n- "${note.message}" (type: ${note.type})`;
}
```

5. Add to `formatCreatorContext`, after the ideas section:
```typescript
if (data.coachNote) {
  sections.push(formatCoachNote(data.coachNote));
}
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai-context.ts
git commit -m "feat: add coach note to AI creator context"
```

---

## Chunk 4: Overview Page — Replace Mock Data with Real Data

This chunk updates the overview page to fetch real goals, coach notes, and coaching tasks from the database, and adds the goal management dialog.

### Task 13: Update Dashboard Data Fetching

**Files:**
- Modify: `src/app/(app)/dashboard/data/getDashboardData.ts`
- Modify: `src/types/dashboard.ts`

- [ ] **Step 1: Update dashboard types**

In `src/types/dashboard.ts`, remove mock types and add real ones. The `IMockCoachNote`, `IMockMilestone`, and `IMockActionItem` interfaces will be replaced by the real Prisma types passed from the data layer. Keep `IStatCard`, `IRecentVideo`, and `IGrowthArticle`.

Replace the file contents:
```typescript
export interface IStatCard {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: string;
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

export interface IGrowthArticle {
  title: string;
  url: string;
  source: string;
  description: string | null;
  imageUrl: string | null;
  publishedAt: string;
}
```

- [ ] **Step 2: Update getDashboardData to fetch coaching data**

In `src/app/(app)/dashboard/data/getDashboardData.ts`, add imports and fetch goals, coach note, and top tasks:

Add imports:
```typescript
import { getGoalsByUser } from "@/lib/domains/goal/goal.service";
import { getCurrentNoteForUser } from "@/lib/domains/coach-note/coach-note.service";
import { getTopTasksForUser } from "@/lib/domains/coaching-task/coaching-task.service";
import { TASK_DASHBOARD_LIMIT } from "@/constants/coaching";
import type { Goal, CoachNote, CoachingTask } from "@/generated/prisma/client";
```

Update the `IDashboardData` interface to include the new fields:
```typescript
export interface IDashboardData {
  greeting: string;
  displayName: string;
  levelInfo: ILevelInfo;
  stats: IStatCard[];
  recentVideos: IRecentVideo[];
  goals: Goal[];
  coachNote: CoachNote | null;
  topTasks: CoachingTask[];
}
```

Add parallel fetches for coaching data after the existing Promise.all (inside the userId check):
```typescript
const [goals, coachNote, topTasks] = userId
  ? await Promise.all([
      getGoalsByUser(userId),
      getCurrentNoteForUser(userId),
      getTopTasksForUser(userId, TASK_DASHBOARD_LIMIT),
    ])
  : [[], null, []];
```

And return the new fields:
```typescript
return { greeting, displayName, levelInfo, stats, recentVideos, goals, coachNote, topTasks };
```

- [ ] **Step 3: Verify compilation**

Run:
```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/types/dashboard.ts src/app/(app)/dashboard/data/getDashboardData.ts
git commit -m "feat: add coaching data to dashboard data fetching"
```

---

### Task 14: Update Overview Components to Use Real Data

**Files:**
- Modify: `src/app/(app)/dashboard/components/CoachNote.tsx`
- Modify: `src/app/(app)/dashboard/components/RecommendedActions.tsx`
- Modify: `src/app/(app)/dashboard/components/MilestoneProgress.tsx`
- Modify: `src/app/(app)/dashboard/overview/page.tsx`
- Modify: `src/app/(app)/dashboard/helpers/mockData.ts`

- [ ] **Step 1: Update CoachNote component**

Replace `src/app/(app)/dashboard/components/CoachNote.tsx` to accept real `CoachNote` data:

```tsx
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ActionButton } from "@/components/Common/ActionButton";
import type { CoachNote as CoachNoteType } from "@/generated/prisma/client";

interface CoachNoteProps {
  note: CoachNoteType | null;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function CoachNote({ note }: CoachNoteProps) {
  return (
    <div className="bg-card p-6 rounded-xl shadow-sm border border-primary/5 relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-primary/15">
      {/* Gradient top accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/60 via-amber-400/60 to-primary/20" />

      {/* Decorative background sparkle */}
      <Sparkles className="absolute top-6 right-6 size-24 text-primary opacity-[0.04] transition-all duration-500 group-hover:scale-125 group-hover:opacity-[0.07] group-hover:rotate-12" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <Sparkles className="size-4 text-primary" />
        </div>
        <h3 className="text-lg font-bold">Coach&apos;s Note</h3>
      </div>

      {/* Message */}
      <p className="text-muted-foreground leading-relaxed mb-6">
        {note?.message ?? "No coaching insight yet. Your first note will appear after the daily coaching run."}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/coaching">
          <ActionButton>View Full Insight</ActionButton>
        </Link>
        {note && (
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(note.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update RecommendedActions component**

Replace `src/app/(app)/dashboard/components/RecommendedActions.tsx` to use real `CoachingTask` data with complete/dismiss buttons:

```tsx
"use client";

import { ListChecks, Check, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { completeTaskAction, dismissTaskAction } from "@/app/(app)/dashboard/actions/coaching-task-actions";
import type { CoachingTask } from "@/generated/prisma/client";

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500 shadow-red-500/40",
  medium: "bg-yellow-500 shadow-yellow-500/40",
  low: "bg-green-500 shadow-green-500/40",
};

const SOURCE_BADGE: Record<string, string> = {
  ai: "bg-primary/10 text-primary",
  system: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  chat: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
};

const SOURCE_LABELS: Record<string, string> = {
  ai: "AI",
  system: "System",
  chat: "Chat",
};

interface RecommendedActionsProps {
  tasks: CoachingTask[];
}

export function RecommendedActions({ tasks }: RecommendedActionsProps) {
  return (
    <div className="bg-card p-6 rounded-xl shadow-sm border border-primary/5 transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <ListChecks className="size-4 text-primary" />
          </div>
          <h3 className="text-lg font-bold">Recommended Actions</h3>
        </div>
        <Link
          href="/dashboard/coaching"
          className="text-xs text-primary font-bold hover:underline"
        >
          View All
        </Link>
      </div>

      {/* Task items */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No tasks yet. Check back after the daily coaching run.
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/20 transition-all duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "size-2 rounded-full shrink-0 shadow-sm",
                    PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.medium
                  )}
                />
                <span className="text-sm font-medium truncate">
                  {task.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                    SOURCE_BADGE[task.source] ?? SOURCE_BADGE.ai
                  )}
                >
                  {SOURCE_LABELS[task.source] ?? task.source}
                </span>
                <button
                  onClick={() => completeTaskAction(task.id)}
                  className="size-6 flex items-center justify-center rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-muted-foreground hover:text-green-600 transition-colors cursor-pointer"
                  title="Complete"
                >
                  <Check className="size-3.5" />
                </button>
                <button
                  onClick={() => dismissTaskAction(task.id)}
                  className="size-6 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update MilestoneProgress component**

Update `src/app/(app)/dashboard/components/MilestoneProgress.tsx` to accept real `Goal[]` data. The visual stays the same, but props change from `IMockMilestone[]` to `Goal[]`:

```tsx
"use client";

import { Users, Eye, Video, Target, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/helpers/formatNumber";
import type { Goal } from "@/generated/prisma/client";

const UNIT_ICON_MAP: Record<string, { icon: React.ElementType; bg: string; text: string }> = {
  subscribers: {
    icon: Users,
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-600 dark:text-violet-400",
  },
  videos: {
    icon: Video,
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  views: {
    icon: Eye,
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-600 dark:text-sky-400",
  },
};

interface MilestoneProgressProps {
  goals: Goal[];
  onAddGoal?: () => void;
  onEditGoal?: (goal: Goal) => void;
}

export function MilestoneProgress({ goals, onAddGoal, onEditGoal }: MilestoneProgressProps) {
  const activeGoals = goals.filter((g) => !g.completed && g.targetValue !== null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Milestone Progress</h3>
        <div className="flex items-center gap-3">
          {onAddGoal && (
            <button
              onClick={onAddGoal}
              className="flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              <Plus className="size-3" />
              Add Goal
            </button>
          )}
        </div>
      </div>

      {/* Milestone cards */}
      <div className="space-y-4">
        {activeGoals.length === 0 ? (
          <div className="bg-card p-8 rounded-xl shadow-sm border border-dashed border-primary/20 text-center">
            <Target className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No goals yet. Add a goal to track your progress.
            </p>
          </div>
        ) : (
          activeGoals.map((goal) => {
            const current = goal.currentValue ?? 0;
            const target = goal.targetValue!;
            const percent = Math.min(Math.round((current / target) * 100), 100);
            const remaining = target - current;
            const unitConfig = UNIT_ICON_MAP[goal.unit ?? ""] ?? {
              icon: Target,
              bg: "bg-primary/10",
              text: "text-primary",
            };
            const Icon = unitConfig.icon;

            return (
              <div
                key={goal.id}
                onClick={() => onEditGoal?.(goal)}
                className={cn(
                  "bg-card p-5 rounded-xl shadow-sm border border-primary/5 transition-all duration-300 hover:shadow-md hover:border-primary/10 group",
                  onEditGoal && "cursor-pointer"
                )}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-10 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
                        unitConfig.bg
                      )}
                    >
                      <Icon className={cn("size-5", unitConfig.text)} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{goal.title}</h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Target className="size-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Target: {formatNumber(target)} {goal.unit ?? ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-3xl font-bold text-primary">{percent}</span>
                    <span className="text-sm font-medium text-primary">%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-primary/10 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full bg-primary transition-all duration-700 ease-out progress-shine",
                      percent >= 90 && "bg-gradient-to-r from-primary to-amber-400"
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* Bottom stats */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-primary font-medium">
                    {formatNumber(current)} {goal.unit ?? ""} reached
                  </span>
                  <span className="text-xs text-muted-foreground italic">
                    {percent >= 90
                      ? "Almost there!"
                      : `${formatNumber(remaining)} ${goal.unit ?? ""} to go`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update overview page to pass real data**

Update `src/app/(app)/dashboard/overview/page.tsx` to use the new dashboard data:

```tsx
import { getDashboardData } from "@/app/(app)/dashboard/data/getDashboardData";
import { getGrowthArticle } from "@/app/(app)/dashboard/data/getGrowthArticle";
import { StatCard } from "@/app/(app)/dashboard/components/StatCard";
import { WelcomeSection } from "@/app/(app)/dashboard/components/WelcomeSection";
import { CoachNote } from "@/app/(app)/dashboard/components/CoachNote";
import { RecommendedActions } from "@/app/(app)/dashboard/components/RecommendedActions";
import { MilestoneProgress } from "@/app/(app)/dashboard/components/MilestoneProgress";
import { RecentVideos } from "@/app/(app)/dashboard/components/RecentVideos";
import { GrowthArticle } from "@/app/(app)/dashboard/components/GrowthArticle";
import { DashboardEntrance } from "@/app/(app)/dashboard/components/DashboardEntrance";
import { OverviewMilestones } from "@/app/(app)/dashboard/components/OverviewMilestones";

export default async function DashboardPage() {
  const [dashboardData, article] = await Promise.all([
    getDashboardData(),
    getGrowthArticle(),
  ]);

  const { greeting, displayName, levelInfo, stats, recentVideos, goals, coachNote, topTasks } =
    dashboardData;

  return (
    <DashboardEntrance className="space-y-8">
      {/* Welcome + XP rank */}
      <div
        className="dash-enter"
        style={{ "--enter-delay": "0ms" } as React.CSSProperties}
      >
        <WelcomeSection
          greeting={greeting}
          displayName={displayName}
          levelInfo={levelInfo}
        />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="dash-enter"
            style={
              { "--enter-delay": `${100 + i * 75}ms` } as React.CSSProperties
            }
          >
            <StatCard stat={stat} />
          </div>
        ))}
      </div>

      {/* Coach's Note + Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div
          className="dash-enter"
          style={{ "--enter-delay": "400ms" } as React.CSSProperties}
        >
          <CoachNote note={coachNote} />
        </div>
        <div
          className="dash-enter"
          style={{ "--enter-delay": "475ms" } as React.CSSProperties}
        >
          <RecommendedActions tasks={topTasks} />
        </div>
      </div>

      {/* Milestone Progress with Goal Dialog */}
      <div
        className="dash-enter"
        style={{ "--enter-delay": "550ms" } as React.CSSProperties}
      >
        <OverviewMilestones goals={goals} />
      </div>

      {/* Recent Videos + Growth Article */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div
          className="dash-enter"
          style={{ "--enter-delay": "625ms" } as React.CSSProperties}
        >
          <RecentVideos videos={recentVideos} />
        </div>
        <div
          className="dash-enter"
          style={{ "--enter-delay": "700ms" } as React.CSSProperties}
        >
          <GrowthArticle article={article} />
        </div>
      </div>
    </DashboardEntrance>
  );
}
```

Note: `OverviewMilestones` is a new thin client wrapper that adds the GoalDialog state management. Created in the next task.

- [ ] **Step 5: Clean up mock data**

In `src/app/(app)/dashboard/helpers/mockData.ts`:
1. Remove `MOCK_COACH_NOTE`, `MOCK_MILESTONES`, and `MOCK_ACTION_ITEMS` exports and their values
2. Remove the `IMockCoachNote`, `IMockMilestone`, and `IMockActionItem` type imports (these types were removed from `dashboard.ts` in Task 13)
3. Keep `MOCK_STATS` and its `IStatCard` type import — it's still used as a fallback when no channel is connected

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/dashboard/components/CoachNote.tsx src/app/(app)/dashboard/components/RecommendedActions.tsx src/app/(app)/dashboard/components/MilestoneProgress.tsx src/app/(app)/dashboard/overview/page.tsx src/app/(app)/dashboard/helpers/mockData.ts
git commit -m "feat: replace overview mock data with real coaching data"
```

---

### Task 15: Goal Dialog & Overview Milestones Wrapper

**Files:**
- Create: `src/app/(app)/dashboard/components/GoalDialog.tsx`
- Create: `src/app/(app)/dashboard/components/OverviewMilestones.tsx`

- [ ] **Step 1: Create GoalDialog component**

Create `src/app/(app)/dashboard/components/GoalDialog.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createGoalAction,
  updateGoalAction,
  deleteGoalAction,
} from "@/app/(app)/dashboard/actions/goal-actions";
import type { Goal } from "@/generated/prisma/client";

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null; // null = create mode, Goal = edit mode
}

export function GoalDialog({ open, onOpenChange, goal }: GoalDialogProps) {
  const isEdit = !!goal;
  const [title, setTitle] = useState(goal?.title ?? "");
  const [targetValue, setTargetValue] = useState(goal?.targetValue?.toString() ?? "");
  const [unit, setUnit] = useState(goal?.unit ?? "");
  const [deadline, setDeadline] = useState(
    goal?.deadline ? goal.deadline.toISOString().split("T")[0] : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (isEdit) {
      await updateGoalAction(goal.id, {
        title,
        targetValue: Number(targetValue),
        unit,
        deadline: deadline || null,
      });
    } else {
      await createGoalAction({
        title,
        targetValue: Number(targetValue),
        unit,
        deadline: deadline || undefined,
      });
    }

    setLoading(false);
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!goal) return;
    setLoading(true);
    await deleteGoalAction(goal.id);
    setLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Goal" : "Add Goal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Reach 500 Subscribers"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Target Value</Label>
              <Input
                id="targetValue"
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="subscribers"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <DialogFooter className="flex justify-between">
            {isEdit && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create OverviewMilestones wrapper**

Create `src/app/(app)/dashboard/components/OverviewMilestones.tsx`:

```tsx
"use client";

import { useState } from "react";
import { MilestoneProgress } from "@/app/(app)/dashboard/components/MilestoneProgress";
import { GoalDialog } from "@/app/(app)/dashboard/components/GoalDialog";
import type { Goal } from "@/generated/prisma/client";

interface OverviewMilestonesProps {
  goals: Goal[];
}

export function OverviewMilestones({ goals }: OverviewMilestonesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  function handleAddGoal() {
    setEditingGoal(null);
    setDialogOpen(true);
  }

  function handleEditGoal(goal: Goal) {
    setEditingGoal(goal);
    setDialogOpen(true);
  }

  return (
    <>
      <MilestoneProgress
        goals={goals}
        onAddGoal={handleAddGoal}
        onEditGoal={handleEditGoal}
      />
      <GoalDialog
        key={editingGoal?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editingGoal}
      />
    </>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run:
```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/dashboard/components/GoalDialog.tsx src/app/(app)/dashboard/components/OverviewMilestones.tsx
git commit -m "feat: add GoalDialog and OverviewMilestones wrapper"
```

---

## Chunk 5: Coaching Page

This chunk creates the new `/dashboard/coaching` route with the full coach note display, active tasks list, and completed tasks section.

### Task 16: Coaching Page Data & Route

**Files:**
- Create: `src/app/(app)/dashboard/coaching/page.tsx`
- Create: `src/app/(app)/dashboard/coaching/components/CoachNoteCard.tsx`
- Create: `src/app/(app)/dashboard/coaching/components/TaskItem.tsx`
- Create: `src/app/(app)/dashboard/coaching/components/ActiveTasks.tsx`
- Create: `src/app/(app)/dashboard/coaching/components/CompletedTasks.tsx`

- [ ] **Step 1: Create TaskItem component**

Create `src/app/(app)/dashboard/coaching/components/TaskItem.tsx`:

```tsx
"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { completeTaskAction, dismissTaskAction } from "@/app/(app)/dashboard/actions/coaching-task-actions";
import type { CoachingTask } from "@/generated/prisma/client";

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500 shadow-red-500/40",
  medium: "bg-yellow-500 shadow-yellow-500/40",
  low: "bg-green-500 shadow-green-500/40",
};

const SOURCE_BADGE: Record<string, string> = {
  ai: "bg-primary/10 text-primary",
  system: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  chat: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
};

const SOURCE_LABELS: Record<string, string> = {
  ai: "AI",
  system: "System",
  chat: "Chat",
};

function formatAge(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

interface TaskItemProps {
  task: CoachingTask;
  showActions?: boolean;
}

export function TaskItem({ task, showActions = true }: TaskItemProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/20 transition-all duration-200">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "size-2.5 rounded-full shrink-0 shadow-sm",
            PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.medium
          )}
        />
        <div className="min-w-0">
          <span className="text-sm font-medium block truncate">{task.title}</span>
          {task.description && (
            <span className="text-xs text-muted-foreground block mt-0.5 truncate">
              {task.description}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <span
          className={cn(
            "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
            SOURCE_BADGE[task.source] ?? SOURCE_BADGE.ai
          )}
        >
          {SOURCE_LABELS[task.source] ?? task.source}
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatAge(task.createdAt)}
        </span>
        {showActions && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => completeTaskAction(task.id)}
              className="size-7 flex items-center justify-center rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-muted-foreground hover:text-green-600 transition-colors cursor-pointer"
              title="Complete"
            >
              <Check className="size-4" />
            </button>
            <button
              onClick={() => dismissTaskAction(task.id)}
              className="size-7 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create CoachNoteCard component**

Create `src/app/(app)/dashboard/coaching/components/CoachNoteCard.tsx`:

```tsx
import { Sparkles } from "lucide-react";
import type { CoachNote } from "@/generated/prisma/client";

const NOTE_TYPE_LABELS: Record<string, string> = {
  insight: "Insight",
  skill_tip: "Skill Tip",
  encouragement: "Encouragement",
  observation: "Observation",
};

interface CoachNoteCardProps {
  note: CoachNote | null;
}

export function CoachNoteCard({ note }: CoachNoteCardProps) {
  return (
    <div className="bg-card p-8 rounded-xl shadow-sm border border-primary/5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/60 via-amber-400/60 to-primary/20" />
      <Sparkles className="absolute top-8 right-8 size-32 text-primary opacity-[0.04]" />

      <div className="flex items-center gap-2 mb-5">
        <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Sparkles className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Coach&apos;s Note</h2>
          {note && (
            <span className="text-xs text-muted-foreground">
              {NOTE_TYPE_LABELS[note.type] ?? note.type}
            </span>
          )}
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed text-base">
        {note?.message ??
          "No coaching insight yet. Your first note will appear after the daily coaching run."}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create ActiveTasks component**

Create `src/app/(app)/dashboard/coaching/components/ActiveTasks.tsx`:

```tsx
import { ListChecks } from "lucide-react";
import { TaskItem } from "@/app/(app)/dashboard/coaching/components/TaskItem";
import type { CoachingTask } from "@/generated/prisma/client";

interface ActiveTasksProps {
  tasks: CoachingTask[];
}

export function ActiveTasks({ tasks }: ActiveTasksProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <ListChecks className="size-4 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Active Tasks</h2>
        <span className="text-sm text-muted-foreground">({tasks.length})</span>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-card p-8 rounded-xl shadow-sm border border-dashed border-primary/20 text-center">
            <p className="text-sm text-muted-foreground">
              No active tasks. Check back after the daily coaching run.
            </p>
          </div>
        ) : (
          tasks.map((task) => <TaskItem key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create CompletedTasks component**

Create `src/app/(app)/dashboard/coaching/components/CompletedTasks.tsx`:

```tsx
"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskItem } from "@/app/(app)/dashboard/coaching/components/TaskItem";
import type { CoachingTask } from "@/generated/prisma/client";

interface CompletedTasksProps {
  tasks: CoachingTask[];
}

export function CompletedTasks({ tasks }: CompletedTasksProps) {
  const [expanded, setExpanded] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 mb-4 cursor-pointer group"
      >
        <div className="size-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
          <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
          Completed
        </h2>
        <span className="text-sm text-muted-foreground">({tasks.length})</span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="opacity-60">
              <TaskItem task={task} showActions={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create coaching page**

Create `src/app/(app)/dashboard/coaching/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentNoteForUser } from "@/lib/domains/coach-note/coach-note.service";
import { getAllPendingTasksForUser, getCompletedTasksForUser } from "@/lib/domains/coaching-task/coaching-task.service";
import { COMPLETED_HISTORY_DAYS } from "@/constants/coaching";
import { CoachNoteCard } from "@/app/(app)/dashboard/coaching/components/CoachNoteCard";
import { ActiveTasks } from "@/app/(app)/dashboard/coaching/components/ActiveTasks";
import { CompletedTasks } from "@/app/(app)/dashboard/coaching/components/CompletedTasks";

export default async function CoachingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [note, pendingTasks, completedTasks] = await Promise.all([
    getCurrentNoteForUser(userId),
    getAllPendingTasksForUser(userId),
    getCompletedTasksForUser(userId, COMPLETED_HISTORY_DAYS),
  ]);

  return (
    <div className="space-y-8">
      <CoachNoteCard note={note} />
      <ActiveTasks tasks={pendingTasks} />
      <CompletedTasks tasks={completedTasks} />
    </div>
  );
}
```

- [ ] **Step 6: Verify app compiles and the page loads**

Run:
```bash
npx tsc --noEmit --pretty 2>&1 | head -20
```

Then test by running `npm run dev` and navigating to `/dashboard/coaching`.

- [ ] **Step 7: Commit**

```bash
git add src/app/(app)/dashboard/coaching/
git commit -m "feat: add coaching page with coach note, active tasks, and completed tasks"
```

---

## Chunk 6: Final Cleanup & Verification

### Task 17: Remove Unused Mock Types & Verify Everything

**Files:**
- Verify: All files compile
- Verify: Overview page renders with real data (or empty states)
- Verify: Coaching page renders
- Verify: Navigation shows "Coaching" instead of "Goals"

- [ ] **Step 1: Verify full TypeScript compilation**

Run:
```bash
npx tsc --noEmit --pretty
```

Expected: No errors.

- [ ] **Step 2: Run dev server and check routes**

Run:
```bash
npm run dev
```

Check:
- `/dashboard/overview` — Coach note, recommended actions, and milestones show real data or empty states
- `/dashboard/coaching` — Coach note card, active tasks, completed section all render
- Navigation bar shows "Coaching" instead of "Goals"
- Clicking "Add Goal" opens the dialog
- Clicking a milestone opens the edit dialog

- [ ] **Step 3: Final commit if any cleanup was needed**

```bash
git add -A
git commit -m "chore: final cleanup for goals & coaching system"
```

---

## Summary

| Chunk | Tasks | Files Changed | Description |
|-------|-------|--------------|-------------|
| 1 | 1-5 | ~8 new, 1 modified | Schema, constants, types, data+service layers |
| 2 | 6-8 | 3 new | System rules, daily coaching service, cron route |
| 3 | 9-12 | 4 new, 2 modified, 1 deleted | Server actions, navigation, AI context |
| 4 | 13-15 | 2 new, 5 modified | Overview page real data + goal dialog |
| 5 | 16 | 5 new | Coaching page with all sub-components |
| 6 | 17 | Verification only | Final compilation check + manual testing |

**Total: ~22 new files, ~8 modified files, 1 deleted file, across 6 reviewable chunks.**
