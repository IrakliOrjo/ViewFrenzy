# Content Pages & Kanban Board — Design Spec

## Overview

Two features for ViewFrenzy: (1) a Content section with Ideas and Plans pages featuring a Notion-like rich text editor, and (2) a Kanban board on the dashboard for visual pipeline management of plans.

**Core concept:** Ideas are freeform brainstorming notes. Plans are actionable, structured content items that move through a production pipeline. Ideas can be promoted to plans. The Kanban board shows only plans the user explicitly adds to it.

## Data Model

### Idea Model (modified)

Simplified from the current model. Freeform — just title and rich text content.

```prisma
model Idea {
  id        String   @id @default(cuid())
  userId    String
  title     String
  content   Json?    // Novel editor JSON (rich text)
  status    String   @default("idea") // "idea" | "archived"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
}
```

**Removed from current Idea model:** `description`, `notes`, `format`, `priority`, `scheduledDate`, `publishDate`, `calendarEventId`, `linkedVideoId`, `linkedVideo` relation. Also remove the reverse `ideas Idea[]` relation from the Video model.

### Plan Model (new)

```prisma
model Plan {
  id           String    @id @default(cuid())
  userId       String
  title        String
  content      Json?     // Novel editor JSON (rich text)
  status       String    @default("idea") // "idea" | "planning" | "in_progress" | "published"
  format       String?   // "long-form" | "short" | "tutorial" | "stream" | "challenge"
  priority     String?   @default("medium") // "low" | "medium" | "high"
  onBoard      Boolean   @default(false)
  template     String?   // template ID (future use)
  sourceIdeaId String?   // link to archived idea (optional)
  publishDate  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
}
```

**User model** gets a new `plans Plan[]` relation.

## Routing & Navigation

All app pages move under `/dashboard/`. This is a restructure of the current route layout.

### Route Structure

```
src/app/(app)/dashboard/
├── layout.tsx                          // Sidebar + main content area
├── overview/
│   └── page.tsx                        // Current dashboard (stats, coach note, milestones, videos)
├── board/
│   └── page.tsx                        // Kanban board
├── content/
│   ├── layout.tsx                      // Ideas|Plans tab navigation
│   ├── ideas/
│   │   ├── page.tsx                    // Ideas card grid
│   │   ├── new/
│   │   │   └── page.tsx               // New idea editor
│   │   └── [id]/
│   │       └── page.tsx               // Idea editor
│   ├── plans/
│   │   ├── page.tsx                    // Plans card grid
│   │   ├── new/
│   │   │   └── page.tsx               // New plan editor
│   │   └── [id]/
│   │       └── page.tsx               // Plan editor
├── goals/
│   └── page.tsx                        // Existing goals page (moved)
├── chat/
│   └── page.tsx                        // Existing chat page (moved)
├── settings/
│   └── page.tsx                        // Existing settings page (moved)
```

### Migration from Current Structure

```
Current:                          After:
(app)/dashboard/page.tsx    →     (app)/dashboard/overview/page.tsx
(app)/ideas/page.tsx        →     (app)/dashboard/content/ideas/page.tsx (replaced)
(app)/goals/page.tsx        →     (app)/dashboard/goals/page.tsx
(app)/chat/page.tsx         →     (app)/dashboard/chat/page.tsx
(app)/settings/page.tsx     →     (app)/dashboard/settings/page.tsx
(app)/onboarding/           →     (app)/dashboard/onboarding/ (if it exists)
```

**Redirect:** `/dashboard` (no sub-path) must redirect to `/dashboard/overview` — either via a `page.tsx` that does `redirect("/dashboard/overview")` or via Next.js middleware.

**Hardcoded route references:** All existing components with hardcoded paths must be updated during migration. Known files:
- `src/components/Header/Header.tsx` — has link to `/settings`
- `src/components/Sidebar/` — nav items with old paths
- `src/constants/navigation.ts` — nav item definitions

### Sidebar Navigation

Items: Overview, Board, Content, Goals, Chat, Settings — all under `/dashboard/`. The current "Analytics" nav item is removed (analytics data is shown on the Overview page). Update `src/constants/navigation.ts` with the new items and paths.

## Shared Editor Component

**Location:** `src/components/Editor/Editor.tsx` — client component

**Library:** Novel (Notion-style editor built on Tiptap, designed for Next.js)

**Behavior:**
- Accepts `initialContent` (JSON) and `onSave` callback
- Slash command menu: `/heading`, `/list`, `/quote`, `/divider`, etc.
- Floating toolbar on text selection: bold, italic, link, code
- Auto-saves on blur or after 2 seconds idle (debounced)
- Manual "Save" button also available
- Placeholder: "Start writing, or type / for commands..."
- Content stored as Tiptap JSON in the `content` field on both models

**Editor page wrapper pattern:**
- Server component page fetches entity from DB
- Passes data to client component editor page
- Editor page renders: Notion-style title input (large, unstyled) + Editor component + metadata
- Calls server action on save

## Ideas Feature

### Ideas Tab (`/dashboard/content/ideas`)

- Server component fetches all user ideas where status != "archived"
- Card grid: responsive 1 col → 2 cols → 3 cols
- "New Idea" button → navigates to `/dashboard/content/ideas/new`
- Each card: title, content preview (~100 chars plain text from JSON), relative date. Plain text extraction from Tiptap JSON requires a shared helper (`src/helpers/extractPlainText.ts`) that walks the JSON node tree.
- Click card → `/dashboard/content/ideas/[id]`

### Idea Editor Page (`/dashboard/content/ideas/[id]`)

- Full-page editor with back button
- Notion-style title input + Editor component
- No metadata fields — ideas are intentionally freeform
- Auto-save + manual save
- "Promote to Plan" button:
  - Creates new Plan with title + content copied
  - Sets `sourceIdeaId` on the plan
  - Marks idea as `status: "archived"`
  - Redirects to new plan editor page
  - Toast: "Idea promoted to plan"

### New Idea (`/dashboard/content/ideas/new`)

- Empty editor page
- First save creates idea via server action, redirects to `/dashboard/content/ideas/[id]`

## Plans Feature

### Plans Tab (`/dashboard/content/plans`)

- Server component fetches all user plans
- Card grid: same layout as ideas
- "New Plan" button → navigates to `/dashboard/content/plans/new`
- Each card: title, content preview, priority badge, format tag, relative date
- Each card has "Add to Board" / "Remove from Board" toggle
- Click card → `/dashboard/content/plans/[id]`

### Plan Editor Page (`/dashboard/content/plans/[id]`)

- Same layout as idea editor (back button, title, Editor component)
- Plus metadata bar above editor:
  - Status selector: Idea → Planning → In Progress → Published
  - Priority selector: Low / Medium / High
  - Format selector: Long-form, Short, Tutorial, Stream, Challenge
  - "Show on Board" toggle
- Status change to "published" auto-sets `publishDate`
- Auto-save calls `updatePlan` for title/content/format/priority/onBoard. Status changes call `updatePlanStatus` separately (not part of auto-save).
- Manual save also available

### New Plan (`/dashboard/content/plans/new`)

- Empty editor, defaults: status "idea", priority "medium", no format
- First save creates via server action, redirects to `/dashboard/content/plans/[id]`

## Kanban Board

### Board Page (`/dashboard/board`)

- Server component fetches plans where `onBoard: true`, grouped by status
- Renders `<KanbanBoard initialPlans={groupedPlans} />` — client component

### KanbanBoard Component

- 4 columns: Idea → Planning → In Progress → Published
- `@dnd-kit` for drag and drop between columns
- Responsive grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-4`
- Local state for optimistic DnD updates
- Drag end → `updatePlanStatus` server action, reverts on failure
- "Add Plans" button — opens a popover/dropdown with a searchable list of plans not currently on the board. Each item has an "Add" button. Supports adding multiple plans without closing the popover.
- "New Plan" button → `/dashboard/content/plans/new`
- Empty state when no plans are on the board

### BoardCard Component

- Compact: title + priority badge + format tag + relative date
- Click → `/dashboard/content/plans/[id]`
- Drag activation distance threshold (5px) to prevent accidental drags
- Drag overlay: slight rotation + shadow

### BoardColumn Component

- Header: icon + title + count badge
- Scrollable card list
- Empty state: dashed border "Drop plans here"
- Min-height for valid drop targets

### Board Behavior

- Only plans with `onBoard: true` appear
- Published plans stay on the board until manually removed
- Users add/remove plans via the Plans tab card toggle, the plan editor toggle, or the board's "Add Plans" picker
- Board and Plans tab show the same underlying data — status changes on either update both
- Cards within a column are sorted by `updatedAt` descending (most recently touched first). No manual reordering within columns — keeps the model simple.

## Server Actions

### Ideas Actions (`src/app/(app)/dashboard/content/ideas/actions.ts`)

| Action | Purpose |
|---|---|
| `createIdea(title, content)` | Create idea, return id |
| `updateIdea(id, { title, content })` | Save editor changes |
| `promoteIdeaToPlan(id)` | Archive idea, create plan with copied content, return plan id |
| `deleteIdea(id)` | Hard delete with confirmation. Clears `sourceIdeaId` on any plans that reference this idea. |

### Plans Actions (`src/app/(app)/dashboard/content/plans/actions.ts`)

| Action | Purpose |
|---|---|
| `createPlan(title, content)` | Create plan, return id |
| `updatePlan(id, { title, content, format, priority, onBoard })` | Save all editor fields + metadata in a single action (auto-save calls this) |
| `updatePlanStatus(id, status)` | Status change, sets publishDate if → published |
| `togglePlanOnBoard(id, onBoard)` | Add/remove from board |
| `deletePlan(id)` | Hard delete with confirmation |

### All Actions

- Use `auth()` for session + ownership verification
- Return `{ success, data?, error? }` pattern
- Revalidation paths per action:

| Action | Revalidate |
|---|---|
| `createIdea` | `/dashboard/content/ideas` |
| `updateIdea` | `/dashboard/content/ideas` |
| `deleteIdea` | `/dashboard/content/ideas` |
| `promoteIdeaToPlan` | `/dashboard/content/ideas`, `/dashboard/content/plans` |
| `createPlan` | `/dashboard/content/plans` |
| `updatePlan` | `/dashboard/content/plans`, `/dashboard/board` |
| `updatePlanStatus` | `/dashboard/content/plans`, `/dashboard/board` |
| `togglePlanOnBoard` | `/dashboard/content/plans`, `/dashboard/board` |
| `deletePlan` | `/dashboard/content/plans`, `/dashboard/board` |

## Templates (Future)

- `template` field on Plan model is reserved but unused
- Content stored as JSON — any template is just pre-filled editor JSON
- Template picker UI to be built later
- No implementation work needed now

## AI Integration (Future)

- AI chatbot can create ideas and plans directly on explicit user instruction
- Mechanism: AI calls a tool/function that invokes the same server actions
- Not in scope for this implementation — requires chat tool-use infrastructure first

## Dependencies to Install

```bash
npm install novel
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```
