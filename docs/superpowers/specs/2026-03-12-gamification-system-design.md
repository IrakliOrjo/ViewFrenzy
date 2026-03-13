# Gamification System Design

## Overview

A leveling, task, challenge, and reward system for ViewFrenzy that gives creators tangible progression and motivation as they grow their YouTube channel. The system introduces coaching tasks, structured challenges, XP tracking with an event log, unlockable rewards, and swappable AI coach personalities.

## Scope

**In scope:**
- XP awarding engine with event log
- Coaching tasks (AI-generated + user-created growth actions)
- Challenges system (30/90-day structured programs with flexible step format)
- Unlockables (cosmetics + AI coach personalities)
- Coach personality system (different AI tones/styles, swappable per user)
- AI tool integrations for tasks and challenges
- Database schema for all new models

**Out of scope (deferred):**
- UI layout/placement for coaching tasks
- Challenge content/curriculum design
- Specific unlock rewards per level
- XP economy balancing/tuning
- Ideas Kanban board UI (separate effort, already planned)

## Architecture: Flat Models + XP Event Log

Flat Prisma models per feature (no polymorphism, no generic entity tables). Each model maps to one concept. An append-only `XpEvent` log sits alongside the existing `User.totalXp` counter for audit trail and future features (XP timeline, leaderboards, economy rebalancing).

---

## Data Models

### XpEvent

Append-only log of every XP award. Always in sync with `User.totalXp` (enforced by transactional writes in `awardXP()`).

```
XpEvent
  - id            String    @id @default(cuid())
  - userId        String    (-> User)
  - amount        Int       (XP awarded)
  - source        String    (e.g., "coaching_task", "challenge_step", "challenge_complete",
                             "goal_complete", "publish_video", "chat", "sync_channel",
                             "onboarding", "login_streak", "milestone")
  - sourceId      String?   (optional FK to the specific task/challenge/goal that triggered it)
  - createdAt     DateTime  @default(now())

  // Relations
  - user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@unique([userId, source, sourceId])  // prevents duplicate XP awards for the same action
```

Note: The `@@unique` constraint on `[userId, source, sourceId]` only applies when `sourceId` is non-null. For sources without a `sourceId` (e.g., `"chat"`, `"login_streak"`), the `awardXP()` service must perform an idempotency check (e.g., "already awarded chat XP in this session") before creating the event.

### CoachingTask

Growth actions created by the AI coach or manually by the user. Challenge daily tasks also materialize here.

```
CoachingTask
  - id            String    @id @default(cuid())
  - userId        String    (-> User)
  - title         String
  - description   String?
  - xpReward      Int       @default(20)
  - status        String    (pending/in_progress/completed/dismissed)
  - source        String    (ai/user/challenge)
  - challengeId   String?   (-> UserChallenge, if source is "challenge")
  - dayNumber     Int?      (challenge day number, if source is "challenge" — avoids joining back to ChallengeStep)
  - completedAt   DateTime?
  - createdAt     DateTime  @default(now())
  - updatedAt     DateTime  @updatedAt

  // Relations
  - user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  - challenge     UserChallenge? @relation(fields: [challengeId], references: [id], onDelete: SetNull)

  @@index([userId, status])
```

### Challenge (template/package)

Admin-seeded challenge definitions. Users don't create these — they enroll in them.

```
Challenge
  - id            String    @id @default(cuid())
  - title         String    ("30-Day Thumbnail Mastery")
  - description   String
  - duration      Int       (number of days: 30, 90, etc.)
  - difficulty    String    (beginner/intermediate/advanced)
  - unlockLevel   Int       @default(1)
  - imageUrl      String?
  - metadata      Json?     (flexible: rules, tips, extra config)
  - isActive      Boolean   @default(true)
  - createdAt     DateTime  @default(now())

  // Relations
  - steps         ChallengeStep[]
  - enrollments   UserChallenge[]
```

### ChallengeStep (one per day in the template)

```
ChallengeStep
  - id            String    @id @default(cuid())
  - challengeId   String    (-> Challenge)
  - dayNumber     Int       (1, 2, 3... up to duration)
  - title         String
  - description   String?
  - xpReward      Int       @default(20)
  - metadata      Json?     (flexible: rules, resources, tips, media links)

  // Relations
  - challenge     Challenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)

  @@index([challengeId, dayNumber])
```

### UserChallenge (enrollment + progress)

```
UserChallenge
  - id            String    @id @default(cuid())
  - userId        String    (-> User)
  - challengeId   String    (-> Challenge)
  - status        String    (active/completed/abandoned)
  - currentDay    Int       @default(1)
  - streakCount   Int       @default(0)
  - startedAt     DateTime  @default(now())
  - completedAt   DateTime?
  - abandonedAt   DateTime?
  - updatedAt     DateTime  @updatedAt

  // Relations
  - user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  - challenge     Challenge      @relation(fields: [challengeId], references: [id], onDelete: Cascade)
  - coachingTasks CoachingTask[]

  @@unique([userId, challengeId])  // prevents duplicate enrollments in the same challenge
```

**Challenge abandonment flow:**
- User-initiated: user explicitly abandons from the challenge page. Sets `status: "abandoned"`, `abandonedAt: now()`. All pending coaching tasks with `source: "challenge"` and this `challengeId` are set to `status: "dismissed"`.
- A user can re-enroll in an abandoned challenge — the existing `UserChallenge` record is reset (`status` back to `"active"`, `currentDay: 1`, `streakCount: 0`, new `startedAt`, clear `abandonedAt` and `completedAt`). This preserves the `@@unique([userId, challengeId])` constraint.

### Unlockable (reward definition)

The single source of truth for what gets unlocked at each level. Coach personalities, cosmetics, and features are all unlocked via this table.

```
Unlockable
  - id            String    @id @default(cuid())
  - name          String    ("Coach Marcus", "Fire Theme", "Gold Badge")
  - description   String
  - type          String    (cosmetic/personality/feature)
  - unlockLevel   Int
  - referenceId   String?   (FK to the specific entity, e.g., CoachPersonality.id when type is "personality")
  - metadata      Json?     (type-specific: avatar URL, theme colors, badge icon)
  - isActive      Boolean   @default(true)
  - createdAt     DateTime  @default(now())

  // Relations
  - userUnlocks   UserUnlock[]
```

### UserUnlock (what a user has unlocked)

```
UserUnlock
  - id            String    @id @default(cuid())
  - userId        String    (-> User)
  - unlockableId  String    (-> Unlockable)
  - unlockedAt    DateTime  @default(now())

  // Relations
  - user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  - unlockable    Unlockable @relation(fields: [unlockableId], references: [id], onDelete: Cascade)

  @@unique([userId, unlockableId])
```

### CoachPersonality

Dedicated model for AI coach personas. Carries the `systemPrompt` that shapes AI behavior. Unlocking is gated exclusively through the `Unlockable` table — `CoachPersonality` itself has no `unlockLevel` field.

```
CoachPersonality
  - id            String    @id @default(cuid())
  - name          String    ("Marcus", "Aria", "Rex")
  - title         String    ("The Drill Sergeant", "The Cheerleader", "The Strategist")
  - description   String
  - tone          String    (strict/friendly/analytical/motivational)
  - systemPrompt  String    (personality block injected into AI system prompt)
  - avatarUrl     String?
  - isDefault     Boolean   @default(false)  (exactly one personality is the default, available to all users)
  - isActive      Boolean   @default(true)
```

The default personality (`isDefault: true`) is always available regardless of unlocks. Non-default personalities require a corresponding `Unlockable` entry with `type: "personality"` and `referenceId` pointing to the `CoachPersonality.id`.

**Personalities differ in expertise, not just tone.** Each personality carries domain-specific knowledge baked into its `systemPrompt`. Examples:
- A video editing expert who can advise on cuts, pacing, transitions, and tooling (DaVinci Resolve, Premiere, CapCut, etc.)
- A psychology-focused coach who helps with procrastination, creative blocks, consistency habits, and motivation
- A SEO/discoverability specialist who focuses on titles, tags, thumbnails, and algorithm strategy
- A storytelling coach who helps with scripting, hooks, and narrative structure

The `tone` field captures communication style (strict/friendly/analytical/motivational), while the `systemPrompt` encodes both tone AND domain expertise. This means two personalities can share a similar tone but offer completely different advice based on their knowledge area.

### User model additions

```
User (existing, add fields)
  - activeCoachId    String?         (-> CoachPersonality, currently selected coach)
  - activeTheme      String?         (cosmetic theme name, for future use)

  // New relations
  - activeCoach      CoachPersonality? @relation(fields: [activeCoachId], references: [id], onDelete: SetNull)
  - xpEvents         XpEvent[]
  - coachingTasks    CoachingTask[]
  - userChallenges   UserChallenge[]
  - userUnlocks      UserUnlock[]
```

**`activeCoachId` validation:** The coach personality service must verify that the user has a corresponding `UserUnlock` for the personality (or that the personality is the default) before allowing the switch. If a personality is deactivated, users with it as `activeCoachId` fall back to the default.

---

## Core Services

### XP Service (`src/lib/domains/xp/xp.service.ts`)

**`awardXP(userId, amount, source, sourceId?)`**

Uses a Prisma interactive transaction (`prisma.$transaction(async (tx) => { ... })`) to ensure atomicity:

1. Create `XpEvent` record (via `tx`)
2. Increment `User.totalXp` using `tx.user.update({ data: { totalXp: { increment: amount } } })` — the `increment` operator prevents lost updates from concurrent calls
3. Read the updated `totalXp` and recalculate `User.level` using the existing `calculateLevel()` helper — update `User.level` to `ILevelInfo.level` (the numeric value; other fields like `title` and `progressPercent` are derived at read time)
4. If leveled up: call `checkAndGrantUnlocks()` for the new level (inside the same transaction)
5. Return `{ newTotalXp, newLevel, leveledUp, unlockedItems[] }`

**Idempotency:** For sources with a `sourceId`, the `@@unique([userId, source, sourceId])` constraint prevents duplicate awards at the database level. For sources without a `sourceId`, the service performs a time-window check (e.g., "chat XP already awarded in this conversation") before creating the event.

**XP amount source of truth:** Constants in `src/constants/xp.ts` define default amounts. The per-row `xpReward` field on `CoachingTask` and `ChallengeStep` allows overrides (e.g., a harder challenge step could award more XP). When awarding, callers pass the per-row value if available, otherwise fall back to the constant.

### New XP constants to add to `src/constants/xp.ts`:

```typescript
COMPLETE_COACHING_TASK: 20,    // default, can be overridden by CoachingTask.xpReward
COMPLETE_CHALLENGE_STEP: 20,   // default, can be overridden by ChallengeStep.xpReward
COMPLETE_CHALLENGE: 100,       // bonus for finishing an entire challenge
```

Source string values should also be codified in a constants file (`src/constants/gamification.ts`) to prevent typos.

### Unlock Service (`src/lib/domains/unlock/unlock.service.ts`)

**`checkAndGrantUnlocks(userId, newLevel)`**

1. Query `Unlockable` where `unlockLevel <= newLevel` and `isActive: true`
2. Filter out already-unlocked items (check `UserUnlock`)
3. Create `UserUnlock` records for new unlocks
4. Return list of newly unlocked items

### Coaching Task Service (`src/lib/domains/coaching-task/`)

Standard CRUD following existing domain service pattern (`.data.ts` + `.service.ts`).

On task completion: calls `awardXP()` with the task's `xpReward` value and `sourceId` set to the task's `id`.

Uses `withCacheInvalidation()` wrapper.

### Challenge Service (`src/lib/domains/challenge/`)

**Starting a challenge:**
1. Check no `UserChallenge` with `status: "active"` exists for this `userId + challengeId`
2. Create `UserChallenge` record
3. Materialize day 1's `ChallengeStep` as a `CoachingTask` with `source: "challenge"`, `challengeId`, and `dayNumber: 1`

**Completing a challenge day:**
1. Mark the `CoachingTask` as completed (triggers XP via coaching task service)
2. Increment `UserChallenge.currentDay` and `streakCount`
3. Materialize the next day's `ChallengeStep` as a new `CoachingTask`
4. If `currentDay > duration`: mark challenge as completed, set `completedAt`, award bonus XP via `awardXP()` with source `"challenge_complete"`

**Abandoning a challenge:**
1. Set `UserChallenge.status` to `"abandoned"`, `abandonedAt` to now
2. Dismiss all pending coaching tasks with this `challengeId` (set `status: "dismissed"`)
3. User can re-enroll later — resets the existing `UserChallenge` record (`status: "active"`, `currentDay: 1`, `streakCount: 0`, new `startedAt`, clear `abandonedAt`/`completedAt`)

### Coach Personality Service (`src/lib/domains/coach-personality/`)

CRUD for personalities. Provides `getActivePersonality(userId)` which:
1. Loads `user.activeCoachId`
2. If set, fetches the personality and verifies the user has the corresponding `UserUnlock` (or it's the default personality)
3. If not set or validation fails, returns the default personality (`isDefault: true`)

---

## AI Integration

### System prompt change (minimal)

The coaching personality is currently hardcoded as `COACHING_SYSTEM_PROMPT` in `src/lib/ai.ts` (inside `buildSystemPrompt()`). The change: instead of the static string, call `getActivePersonality(userId)` and inject the returned `CoachPersonality.systemPrompt` in its place. If no coach is selected, use the default personality. This is a replacement, not an addition — no prompt bloat.

Tasks and challenges are NOT pre-loaded into the system prompt. The AI accesses them on-demand via tools.

### New AI tools (`ai-tools.ts`)

**Coaching tasks:**
- `create_coaching_task` — AI suggests a growth action
- `list_coaching_tasks` — AI checks what's on the user's plate
- `update_coaching_task` — AI updates status/description
- `delete_coaching_task` — AI removes a task

**Challenges (read-only for AI):**
- `get_active_challenge` — returns current challenge progress, day, streak
- `list_available_challenges` — shows what challenges the user can start

All tools follow the existing pattern in `ai-tool-handlers.ts` with domain service calls.

---

## XP Award Trigger Points

| Trigger | Location | Source string | Amount source |
|---------|----------|---------------|---------------|
| Complete coaching task | `coaching-task.service.ts` | `"coaching_task"` | `CoachingTask.xpReward` (default: `XP_REWARDS.COMPLETE_COACHING_TASK`) |
| Complete challenge day | `challenge.service.ts` | `"challenge_step"` | `ChallengeStep.xpReward` (default: `XP_REWARDS.COMPLETE_CHALLENGE_STEP`) |
| Finish entire challenge | `challenge.service.ts` | `"challenge_complete"` | `XP_REWARDS.COMPLETE_CHALLENGE` |
| Complete a goal | `goal.service.ts` | `"goal_complete"` | `XP_REWARDS.COMPLETE_GOAL` |
| Publish a video | Event scanner cron (future) | `"publish_video"` | `XP_REWARDS.PUBLISH_VIDEO` |
| Chat with coach | `chat/route.ts` | `"chat"` | `XP_REWARDS.CHAT_WITH_COACH` |
| Sync channel | `youtube/sync/route.ts` | `"sync_channel"` | `XP_REWARDS.SYNC_CHANNEL` |
| Complete onboarding | Onboarding flow (future) | `"onboarding"` | `XP_REWARDS.COMPLETE_ONBOARDING` |
| Weekly login streak | Cron job (future) | `"login_streak"` | `XP_REWARDS.WEEKLY_LOGIN_STREAK` |
| Hit a milestone | Event scanner (future) | `"milestone"` | `XP_REWARDS.HIT_MILESTONE` |

---

## New Domain Services Structure

```
src/lib/domains/
├── coaching-task/
│   ├── coaching-task.data.ts
│   └── coaching-task.service.ts
├── challenge/
│   ├── challenge.data.ts
│   └── challenge.service.ts
├── xp/
│   ├── xp.data.ts
│   └── xp.service.ts
├── unlock/
│   ├── unlock.data.ts
│   └── unlock.service.ts
├── coach-personality/
│   ├── coach-personality.data.ts
│   └── coach-personality.service.ts
```

---

## Seed Data Required

- **Default CoachPersonality** — `isDefault: true`, available to all users, uses current `COACHING_SYSTEM_PROMPT` from `ai.ts` as its `systemPrompt`
- **Unlockable entry for default coach** — `type: "personality"`, `unlockLevel: 1`, `referenceId` pointing to the default personality
- **Challenge templates + steps** — added later as challenge content is designed
- **Unlockable entries** — added later as rewards are decided per level

---

## Constants Files

### `src/constants/xp.ts` (existing, add entries)

Add `COMPLETE_COACHING_TASK`, `COMPLETE_CHALLENGE_STEP`, and `COMPLETE_CHALLENGE` to the existing `XP_REWARDS` object.

### `src/constants/gamification.ts` (new)

Codify the canonical source strings for `XpEvent.source` and `CoachingTask.source` to prevent typos:

```typescript
export const XP_SOURCES = {
  COACHING_TASK: "coaching_task",
  CHALLENGE_STEP: "challenge_step",
  CHALLENGE_COMPLETE: "challenge_complete",
  GOAL_COMPLETE: "goal_complete",
  PUBLISH_VIDEO: "publish_video",
  CHAT: "chat",
  SYNC_CHANNEL: "sync_channel",
  ONBOARDING: "onboarding",
  LOGIN_STREAK: "login_streak",
  MILESTONE: "milestone",
} as const;

export const TASK_SOURCES = {
  AI: "ai",
  USER: "user",
  CHALLENGE: "challenge",
} as const;
```

---

## Design Decisions

1. **Flat models over polymorphism** — each model maps to one concept, easy to query and evolve independently.
2. **XP event log + counter** — `XpEvent` for audit trail, `User.totalXp` for fast reads. `awardXP()` writes both inside a Prisma interactive transaction with `increment` to prevent race conditions.
3. **Fixed XP per task for now** — `xpReward` field on each task allows migration to category-based XP later without schema changes. Constants provide defaults; per-row values allow overrides.
4. **Challenges materialize as coaching tasks** — hybrid approach: challenges have their own page/tracker, but daily steps also appear as coaching tasks so everything is in one "what to do today" view.
5. **AI tools over context injection** — tasks and challenges are accessed via on-demand AI tools, not pre-loaded into system prompt. Compatible with planned context management system.
6. **Coach personality is a prompt swap** — replaces the hardcoded `COACHING_SYSTEM_PROMPT` in `ai.ts`, no prompt bloat. Everything else (analytics, growth rules, tools) stays the same.
7. **Separate CoachPersonality model, unlocked via Unlockable table** — CoachPersonality carries functional data (`systemPrompt`), but unlock gating is exclusively through the `Unlockable` table with `referenceId` pointing to the personality. No `unlockLevel` on CoachPersonality itself — single source of truth for unlocks.
8. **Coaching task UI placement deferred** — data model is ready, UI location decided during implementation.
9. **Challenge abandonment is user-initiated** — sets status to `"abandoned"`, dismisses pending challenge tasks, allows re-enrollment via a new `UserChallenge` record.
10. **`activeCoachId` validated against unlocks** — the coach personality service checks `UserUnlock` before allowing a switch, with fallback to default personality.
