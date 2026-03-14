# Goals & Coaching System Design

## Overview

A system that brings Goals, Coach's Notes, and Coaching Tasks together as the core productivity loop in ViewFrenzy. The daily cron generates personalized coaching content through a hybrid approach: free system-rule checks for obvious actions, plus one AI call per user per day for intelligent tips and pattern-based tasks.

## Scope

**In scope:**
- Goal entity finalization (existing model, no schema changes)
- CoachNote entity (new model) — daily AI-generated tip
- CoachingTask entity (new model) — actionable items from 3 sources
- Daily coaching cron (system rules + AI generation)
- Overview page: replace mock data with real data, add goal management dialogs
- Coaching page: new `/dashboard/coaching` route
- Server actions for goal and task management
- Domain services for all entities

**Out of scope:**
- AI tool declarations for coaching tasks/notes (defined later, after entities are solid)
- Coach's Note history/feed (future, if notes prove valuable)
- XP awards for completing tasks (gamification system, separate effort)
- Push notifications for coaching (separate effort)

---

## Entity Model

### Goal (existing — no schema changes)

Uses the existing `Goal` model as-is. Displayed as milestone progress bars on the overview page.

```
Goal (existing)
  - id              String    @id @default(cuid())
  - userId          String
  - title           String    ("Reach 500 Subscribers")
  - description     String?
  - targetValue     Float?    (500)
  - currentValue    Float?    (487)
  - unit            String?   ("subscribers")
  - deadline        DateTime?
  - completed       Boolean   @default(false)
  - calendarEventId String?
  - createdAt       DateTime  @default(now())
  - updatedAt       DateTime  @updatedAt
```

- Created via "Add Goal" button on overview (dialog) or via AI chat tool call
- Edited/deleted by clicking a milestone → dialog
- No dedicated page — lives on overview, managed via dialogs
- Typically 2-5 active goals at a time

### CoachNote (new model)

A single rotating AI-generated tip/insight. One active note shown at a time (the latest). Generated daily by cron or on-demand by the AI coach during chat.

```
CoachNote
  - id        String   @id @default(cuid())
  - userId    String   (-> User)
  - message   String   (the tip/insight text)
  - type      String   @default("insight")  (insight/skill_tip/encouragement/observation)
  - source    String   @default("daily_cron")  (daily_cron/chat)
  - createdAt DateTime @default(now())

  // Relations
  - user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
```

**Note types:**
- `insight` — analytics-based observation ("Your question-format titles get 2x more clicks")
- `skill_tip` — based on creator's struggles/profile ("Here's a technique for better on-camera delivery")
- `encouragement` — motivational ("You've been consistent for 3 weeks straight")
- `observation` — behavioral pattern ("You tend to add ideas but not develop them into plans")

**Coach can update notes:** When the user asks the AI for a tip or the AI decides to give one during chat, it creates a new CoachNote with `source: "chat"`, which becomes the new active note on the dashboard.

### CoachingTask (new model)

Actionable to-do items generated from three sources. Displayed as "Recommended Actions" on the overview (top 3) and in full on the coaching page.

```
CoachingTask
  - id           String    @id @default(cuid())
  - userId       String    (-> User)
  - title        String    ("Try a shorter intro on your next video")
  - description  String?   (optional longer explanation)
  - priority     String    @default("medium")  (high/medium/low)
  - status       String    @default("pending")  (pending/completed/dismissed)
  - source       String    (ai/system/chat)
  - sourceDetail String?   (what triggered it: "goal_deadline", "upload_gap", "plan_stale", etc.)
  - completedAt  DateTime?
  - expiresAt    DateTime? (auto-dismiss after this date)
  - createdAt    DateTime  @default(now())
  - updatedAt    DateTime  @updatedAt

  // Relations
  - user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([userId, status, priority])
```

**Three sources:**

1. **System rules** (`source: "system"`) — free, no AI call. Direct factual checks:
   - Upload gap detection
   - Goal deadline proximity
   - Goal near-completion
   - Stale plans
   - Idle ideas

2. **AI daily cron** (`source: "ai"`) — one API call per day. Pattern-based insights:
   - "Your last 3 videos with question titles got 2x views — use a question in your next title"
   - "Your retention drops at the 2-min mark consistently — try moving your hook"

3. **AI chat** (`source: "chat"`) — created during conversation when relevant:
   - User says "remind me to work on thumbnails" → AI creates a task

**Lifecycle:**
- Generated daily by cron (batch of system + AI tasks)
- User sees top 3 by priority on overview
- User can complete (checkmark) or dismiss (X)
- When completed, count goes down (no replacement generated)
- Uncompleted tasks carry over to the next day
- Auto-dismissed after 5 days if not acted on

**Priority assignment:**
- System tasks: priority assigned by rule (e.g., goal deadline <3 days = high, upload gap 7+ days = high)
- AI tasks: AI assigns priority at creation time
- Chat tasks: AI assigns priority based on context

**Coach can update tasks:** The AI can create, update priority/status, and dismiss tasks during chat when the user asks.

### User model additions

```
User (existing, add relations)
  - coachNotes    CoachNote[]
  - coachingTasks CoachingTask[]
```

---

## Daily Cron Flow

One cron job runs daily. Approach C: single AI call + separate system-rule pass.

### Step 1: System-rule task generation (no AI, free)

For each active user, check these rules:

| Rule | Condition | Task title | Priority logic |
|------|-----------|------------|---------------|
| Upload gap | No video published in 4+ days | "It's been X days since your last upload" | High if 7+ days, Medium if 4-6 |
| Goal deadline approaching | Goal deadline within 7 days | "Your goal 'X' deadline is in Y days — you're at Z%" | High if <3 days, Medium if 3-7 |
| Goal almost complete | currentValue >= 90% of targetValue | "You're X away from your goal 'Y' — push for it!" | High |
| Stale plan | Plan in "in_progress" for 7+ days | "Your plan 'X' has been in progress for Y days" | Medium |
| Idle ideas | 3+ ideas with no plan created in 14 days | "You have X ideas waiting — pick one to develop" | Low |

**Deduplication:** Before creating a system task, check if a pending task with the same `sourceDetail` and related entity already exists. If yes, skip.

### Step 2: AI generation (one API call per user)

Build context payload:
- Creator profile (niche, content style, struggles)
- Current channel stats + recent video performance
- Active goals and progress
- Existing pending tasks (so AI doesn't duplicate)

Prompt asks for structured JSON response containing:
- 1 CoachNote (message + type)
- 1-2 CoachingTasks (title + priority)

Parse response, save CoachNote and CoachingTasks with `source: "ai"`.

### Step 3: Expiry cleanup

Auto-dismiss any pending tasks where `expiresAt < now()` or `createdAt` is older than 5 days (for tasks without explicit `expiresAt`). Set `status: "dismissed"`.

### Cost estimate

- 1 AI call per user per day (~$0.005-0.01 per call)
- 100 users: ~$0.50-1.00/day (~$15-30/month)
- System-rule checks: free (database queries only)

---

## Pages & UI Structure

### Overview page (existing — updated)

Replace mock data with real data:

| Component | Current | Updated |
|-----------|---------|---------|
| CoachNote card | `MOCK_COACH_NOTE` | Latest `CoachNote` from DB |
| RecommendedActions card | `MOCK_ACTION_ITEMS` | Top 3 `CoachingTask` by priority |
| MilestoneProgress | `MOCK_MILESTONES` | Active `Goal` records |

New additions:
- **"Add Goal" button** on milestone section → opens dialog (title, target value, unit, deadline)
- **Click a milestone** → opens edit/delete dialog
- **Complete action** directly from overview (checkmark button, task disappears from top 3)
- **"View All" on actions** → navigates to `/dashboard/coaching`
- **"View Full Insight" on coach note** → navigates to `/dashboard/coaching`

### Coaching page (new: `/dashboard/coaching`)

Layout top to bottom:

1. **Coach's Note** — same card style as overview but larger/more prominent. Shows the current active note (latest by `createdAt`).

2. **Active Tasks section** — all pending coaching tasks, sorted by priority (high → medium → low), then by `createdAt` (oldest first within same priority). Each task shows:
   - Priority dot (red = high, yellow = medium, green = low)
   - Title text
   - Source badge ("System" / "AI" / "Chat")
   - Age indicator ("2 days ago", "today")
   - Complete button (checkmark)
   - Dismiss button (X)

3. **Completed section** — collapsed by default, expandable. Shows tasks completed in the last 7 days. Provides a sense of progress/accomplishment.

No manual task creation on this page — tasks come from the daily cron or from the AI coach during chat.

### Goal dialog (on overview page)

Simple dialog with fields:
- Title (required)
- Target value (required, number input)
- Unit (required — free text: "subscribers", "views", "videos", etc.)
- Deadline (optional date picker)

Minimal — no description field. Users can elaborate through the coach chat.

---

## Services & Data Layer

### Domain services

```
src/lib/domains/
├── goal/                          (existing)
│   ├── goal.data.ts               (existing — Prisma queries)
│   └── goal.service.ts            (existing — business logic)
├── coaching-task/                  (new)
│   ├── coaching-task.data.ts      (Prisma queries)
│   └── coaching-task.service.ts   (business logic + cache invalidation)
├── coach-note/                    (new)
│   ├── coach-note.data.ts         (Prisma queries)
│   └── coach-note.service.ts      (business logic + cache invalidation)
├── coaching/                       (new)
│   └── daily-coaching.service.ts  (orchestrates daily cron flow)
```

### coaching-task.service.ts

Key operations:
- `getTopTasks(userId, limit)` — top N pending tasks by priority
- `getAllPendingTasks(userId)` — all pending tasks for coaching page
- `getCompletedTasks(userId, sinceDays)` — completed tasks in last N days
- `completeTask(userId, taskId)` — set status "completed", set completedAt
- `dismissTask(userId, taskId)` — set status "dismissed"
- `createTask(userId, data)` — used by cron and AI chat
- `expireStaleTasks(userId)` — auto-dismiss tasks past expiry

### coach-note.service.ts

Key operations:
- `getCurrentNote(userId)` — latest CoachNote by createdAt
- `createNote(userId, data)` — used by cron and AI chat

### daily-coaching.service.ts

Orchestrates the full daily flow:
1. Run system-rule checks → create CoachingTasks
2. Build AI context → call AI → parse response → create CoachNote + CoachingTasks
3. Run expiry cleanup

### Cron API route

`src/app/api/cron/daily-coaching/route.ts`
- Authenticated with `CRON_SECRET` header
- Fetches all active users
- Calls `dailyCoachingService` for each user
- Returns summary of what was generated

### Server actions

- `src/app/(app)/dashboard/actions/goal-actions.ts` — createGoal, updateGoal, deleteGoal (for overview dialog)
- `src/app/(app)/dashboard/actions/coaching-task-actions.ts` — completeTask, dismissTask (for overview + coaching page)

### AI context (no changes)

`ai-context.ts` already fetches goals and ideas. Coaching tasks are NOT injected into the AI system prompt — the AI accesses them on-demand via tools (defined later).

---

## System-Rule Definitions

### Upload gap

```
Condition: latest Video.publishedAt is 4+ days ago
sourceDetail: "upload_gap"
Priority:
  - 7+ days → high
  - 4-6 days → medium
Dedup key: sourceDetail = "upload_gap" (only one pending at a time)
```

### Goal deadline approaching

```
Condition: Goal.deadline is within 7 days AND Goal.completed = false
sourceDetail: "goal_deadline:{goalId}"
Priority:
  - <3 days → high
  - 3-7 days → medium
Dedup key: sourceDetail (per goal)
```

### Goal almost complete

```
Condition: Goal.currentValue >= 90% of Goal.targetValue AND Goal.completed = false
sourceDetail: "goal_near_complete:{goalId}"
Priority: high
Dedup key: sourceDetail (per goal)
```

### Stale plan

```
Condition: Plan.status = "in_progress" AND Plan.updatedAt is 7+ days ago
sourceDetail: "plan_stale:{planId}"
Priority: medium
Dedup key: sourceDetail (per plan)
```

### Idle ideas

```
Condition: 3+ Ideas exist AND no Plan created in last 14 days
sourceDetail: "idle_ideas"
Priority: low
Dedup key: sourceDetail (only one pending at a time)
```

---

## Constants

### `src/constants/coaching.ts`

```typescript
export const TASK_PRIORITIES = ["high", "medium", "low"] as const;
export const TASK_STATUSES = ["pending", "completed", "dismissed"] as const;
export const TASK_SOURCES = ["ai", "system", "chat"] as const;

export const NOTE_TYPES = ["insight", "skill_tip", "encouragement", "observation"] as const;
export const NOTE_SOURCES = ["daily_cron", "chat"] as const;

export const TASK_EXPIRY_DAYS = 5;
export const TASK_DASHBOARD_LIMIT = 3;
export const COMPLETED_HISTORY_DAYS = 7;
```

---

## Navigation

Updated app navigation:

- **Overview** (`/dashboard/overview`) — stats, top 3 tasks, coach note, milestone goals, recent videos
- **Coaching** (`/dashboard/coaching`) — full coach note + all tasks + completed history
- **Ideas** (`/dashboard/content/ideas`) — already built
- **Plans** (`/dashboard/content/plans`) — already built
- **Board** (`/dashboard/board`) — kanban, already built

The `/dashboard/goals` stub page is removed — goals live on the overview as milestones.

---

## Design Decisions

1. **Goals = Milestones** — same entity, same model. No separate concept needed.
2. **CoachingTask = Recommended Actions** — same entity. Aligns with the gamification system's CoachingTask model for future XP integration.
3. **Coach's Note is separate from Coaching Tasks** — note is an observation/tip (read-only), tasks are actionable to-dos (completable). Different user interactions.
4. **Hybrid daily cron (Approach C)** — system rules are free and handle obvious factual checks. One AI call per user per day handles intelligent tips and pattern-based tasks. Cheapest option with best quality balance.
5. **No replacement on completion** — when a user completes a task, the count goes down. Fresh tasks only come from the next day's cron or from chat. Prevents "infinite to-do list" fatigue.
6. **Carry over + expiry** — uncompleted tasks carry to the next day. Auto-dismissed after 5 days. Prevents stale tasks cluttering the list.
7. **Priority-based display** — top 3 by priority on overview. Hybrid priority assignment: AI assigns at creation for AI/chat tasks, rules assign for system tasks.
8. **Goals on overview only** — no dedicated goals page. Too simple an entity for its own route. Add/edit via dialog, managed through overview or chat.
9. **No Coach's Note history for now** — model stores all notes (history is easy to add later), but UI only shows the latest. Validate value first.
10. **AI can manage both entities via chat** — coach can create/update coaching tasks and create new coach notes during conversation.
