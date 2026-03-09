# Content Ideas Kanban Board — Implementation Plan

## Context

The `/ideas` page is currently a placeholder. Users need a Kanban board to manage their content pipeline — tracking video ideas from conception through publication. The database `Idea` model already exists with all needed fields. The user will provide an HTML design file for styling reference.

## Design Summary

- **Location:** `/ideas` page (dedicated, full-page board)
- **Columns:** Idea → Planning → In Progress → Published
- **Drag & drop:** @dnd-kit for card movement between columns
- **Create:** "New Idea" button → modal form → lands in "Idea" column
- **Edit/Delete:** Click card → detail modal with edit/delete
- **Data layer:** Next.js Server Actions + optimistic UI updates
- **No schema changes** — existing `Idea` model is sufficient

## Implementation Steps

### Step 0: Install Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npx shadcn@latest add select
```

Available shadcn: dialog, button, badge, input, textarea, scroll-area, dropdown-menu, sonner, sheet. **Missing:** select.

### Step 1: Types — `src/types/ideas.ts` (NEW)

Define shared types:
- `IDEA_STATUSES` const array + `IdeaStatus` union (`"idea" | "planning" | "in_progress" | "published"`)
- `IDEA_PRIORITIES` + `IdeaPriority` (`"low" | "medium" | "high"`)
- `IDEA_FORMATS` + `IdeaFormat` (content format options)
- `IIdea` interface — mirrors Prisma model with serialized dates (strings)
- `IKanbanColumn` — column config (id, title, icon, color)
- `IIdeaFormData` — form submission shape

### Step 2: Constants — `src/app/(app)/ideas/constants/columns.ts` (NEW)

- `KANBAN_COLUMNS` array defining 4 columns with icons/colors
- `PRIORITY_CONFIG` — priority badge colors (red/yellow/green)
- `FORMAT_CONFIG` — format label display names

### Step 3: Server Actions — `src/app/(app)/ideas/actions.ts` (NEW)

First server actions file in the project. All actions use `auth()` for session + ownership checks.

| Action | Purpose |
|---|---|
| `createIdea(data)` | Create idea with `status: "idea"` |
| `updateIdeaStatus(id, status)` | DnD status change (sets `publishDate` if → published) |
| `updateIdea(id, data)` | Edit details from detail modal |
| `deleteIdea(id)` | Delete with ownership check |

All call `revalidatePath("/ideas")` after mutation.

### Step 4: Data Fetcher — `src/app/(app)/ideas/data/getIdeasData.ts` (NEW)

Follows pattern from `src/app/(app)/dashboard/data/getDashboardData.ts`:
- Fetch all user ideas via `prisma.idea.findMany`
- Serialize dates to ISO strings
- Group by status into `Record<IdeaStatus, IIdea[]>`
- Return `{ ideas, totalCount }`

### Step 5: Card Component — `src/app/(app)/ideas/components/IdeaCard.tsx` (NEW)

Leaf component, `"use client"`. Uses `useSortable` from @dnd-kit.
- Displays: title (truncated) + priority badge + format tag
- Uses `formatRelativeTime` from `@/helpers/date`
- Click opens detail modal (DnD activationConstraint distance:5 prevents accidental drags)
- Drag overlay: `rotate-[3deg] shadow-xl scale-105`

### Step 6: Column Component — `src/app/(app)/ideas/components/IdeaColumn.tsx` (NEW)

`"use client"`. Uses `useDroppable`.
- Column header: icon + title + count badge
- Scrollable card list
- Empty state: dashed border "Drop ideas here"
- Min-height for valid drop target when empty

### Step 7: Create Modal — `src/app/(app)/ideas/components/IdeaFormModal.tsx` (NEW)

Uses shadcn `Dialog`. Fields: title (required), description, format (Select), priority (Select, default medium), notes.
- `useTransition` for pending state
- Calls `createIdea` server action
- Success: close modal, page revalidates

### Step 8: Detail Modal — `src/app/(app)/ideas/components/IdeaDetailModal.tsx` (NEW)

Uses shadcn `Dialog`. Two modes:
- **View:** displays all fields + status/priority/format badges + timestamps
- **Edit:** same fields as create, pre-populated. Uses `updateIdea` action.
- **Delete:** confirmation pattern (double-click). Uses `deleteIdea` action.
- **Status change:** dropdown to move between statuses. Uses `updateIdeaStatus` action.

### Step 9: Board Component — `src/app/(app)/ideas/components/IdeasBoard.tsx` (NEW)

Main `"use client"` orchestrator. This is the most complex file.
- `DndContext` with `closestCorners` collision detection
- Sensors: `PointerSensor` (distance: 5) + `KeyboardSensor` + `TouchSensor`
- Local state `Record<IdeaStatus, IIdea[]>` for optimistic DnD updates
- `onDragStart` → set activeId
- `onDragOver` → live preview of card moving between columns
- `onDragEnd` → commit move via `updateIdeaStatus`, revert on failure
- `DragOverlay` → renders card clone
- "New Idea" button (triggers IdeaFormModal)
- Empty board state when totalCount === 0
- Responsive grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-4`

### Step 10: Page Component — `src/app/(app)/ideas/page.tsx` (MODIFY)

Replace placeholder with server component that:
- Calls `getIdeasData()`
- Renders page header (title + description)
- Renders `<IdeasBoard initialIdeas={ideas} totalCount={totalCount} />`

## File Tree

```
src/
├── types/ideas.ts                                    (NEW)
├── app/(app)/ideas/
│   ├── page.tsx                                      (MODIFY)
│   ├── actions.ts                                    (NEW)
│   ├── data/getIdeasData.ts                          (NEW)
│   ├── constants/columns.ts                          (NEW)
│   └── components/
│       ├── IdeasBoard.tsx                             (NEW)
│       ├── IdeaColumn.tsx                             (NEW)
│       ├── IdeaCard.tsx                               (NEW)
│       ├── IdeaFormModal.tsx                           (NEW)
│       └── IdeaDetailModal.tsx                        (NEW)
└── components/ui/select.tsx                           (NEW via shadcn CLI)
```

## Key Patterns to Reuse

- **Data fetcher:** Follow `src/app/(app)/dashboard/data/getDashboardData.ts` pattern
- **Auth:** `const session = await auth()` → `session.user.id`
- **Prisma:** `import { prisma } from "@/lib/prisma"`
- **Styling:** `cn()` from `@/lib/utils`, warm orange primary, `rounded-2xl` cards
- **Date formatting:** `formatRelativeTime` from `@/helpers/date`
- **Toasts:** `sonner` (already installed) for success/error feedback

## Verification

1. `npm run dev` — page loads without errors
2. Navigate to `/ideas` — board renders with 4 empty columns
3. Click "New Idea" → modal opens → fill form → submit → card appears in "Idea" column
4. Drag card from "Idea" to "Planning" → card moves, DB updates
5. Click card → detail modal → edit fields → save → card updates
6. Delete card → card removed from board
7. Refresh page → all changes persisted
8. Check Prisma Studio (`npx prisma studio`) → Idea records have correct status values

## Notes

- The user will provide an HTML design file — styling in components will be adapted to match
- This is the first use of Server Actions in the project — establishes the pattern for future features
- No card ordering within columns (sorted by `createdAt` desc) — keeps it simple
